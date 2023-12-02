/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-07 16:04:55
 * @Description:
 */
import {
	Container,
	Instance,
	appendChildToContainer,
	commitUpdate,
	insertChildToContainer,
	removeChild
} from 'hostConfig'
import { FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber'
import {
	MutationMask,
	NoFlags,
	Placement,
	Update,
	ChildDeletion,
	PassiveEffect,
	Flags,
	PassiveMask
} from './fiberFlags'
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags'
import { Effect, FCUpdateQueue } from './fiberhooks'
import { HookHasEffect } from './hookEffectTags'

export const commitMutationEffects = (
	finishedWork: FiberNode,
	root: FiberRootNode
) => {
	let nextEffect = finishedWork
	while (nextEffect !== null) {
		const child = nextEffect.child
		if (
			(nextEffect.subtreeFlags & (MutationMask | PassiveMask)) !== NoFlags &&
			child !== null
		) {
			nextEffect = child
		} else {
			up: while (nextEffect !== null) {
				commitMutationEffectsOnFiber(nextEffect, root)
				const sibling = nextEffect.sibling
				if (sibling !== null) {
					nextEffect = sibling
					break up
				}
				nextEffect = nextEffect.return!
			}
		}
	}
}

// update dom and remove flag
const commitMutationEffectsOnFiber = (
	finishedWork: FiberNode,
	root: FiberRootNode
) => {
	debugger
	const flags = finishedWork.flags
	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork)
		// remove Placement from flags
		finishedWork.flags &= ~Placement
	}

	// update
	if ((flags & Update) !== NoFlags) {
		commitUpdate(finishedWork)
		// remove Placement from flags
		finishedWork.flags &= ~Update
	}

	// childDelection
	if ((flags & ChildDeletion) !== NoFlags) {
		const deletions = finishedWork.deletions
		if (deletions !== null) {
			deletions.forEach((childToDelete: FiberNode) => {
				commitDeletion(childToDelete, root)
			})
		}
		// remove Placement from flags
		finishedWork.flags &= ~ChildDeletion
	}
	if ((flags & PassiveEffect) !== NoFlags) {
		// collect callback
		commitPassiveEffect(finishedWork, root, 'update')
		finishedWork.flags &= PassiveEffect
	}
}

const commitPassiveEffect = (
	fiber: FiberNode,
	root: FiberRootNode,
	type: keyof PendingPassiveEffects
) => {
	if (fiber.tag !== FunctionComponent) return
	if (type === 'update' && (fiber.flags & PassiveEffect) === NoFlags) return

	const updateQueue = fiber.updateQueue as FCUpdateQueue<any>
	if (updateQueue !== null) {
		if (updateQueue.lastEffect === null && __DEV__) {
			console.error(
				'When it has PassiveEffect flag exist, lastEffect is not supposed to be null'
			)
		}
		root.pendingPassiveEffects[type].push(updateQueue.lastEffect as Effect)
	}
}

const commitHookEffectList = (
	flags: Flags,
	lastEffect: Effect,
	callback: (effect: Effect) => void
) => {
	let effect = lastEffect.next as Effect

	do {
		if ((effect.tag & flags) === flags) {
			callback(effect)
		}
		effect = effect.next as Effect
	} while (effect !== lastEffect.next)
}

export const commitHookEffectListUnmount = (
	flags: Flags,
	lastEffect: Effect
) => {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const destory = effect.destory
		if (typeof destory === 'function') {
			destory()
		}
		effect.tag &= ~HookHasEffect
	})
}

export const commitHookEffectListDestory = (
	flags: Flags,
	lastEffect: Effect
) => {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const destory = effect.destory
		if (typeof destory === 'function') {
			destory()
		}
	})
}

export const commitHookEffectListCreate = (
	flags: Flags,
	lastEffect: Effect
) => {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const create = effect.create
		if (typeof create === 'function') {
			effect.destory = create()
		}
	})
}

const recordHostChildrenToDelete = (
	childrenToDelete: FiberNode[],
	unmountFiber: FiberNode
) => {
	const lastOne = childrenToDelete[childrenToDelete.length - 1]
	if (!lastOne) {
		childrenToDelete.push(unmountFiber)
	} else {
		let node = lastOne.sibling
		while (node !== null) {
			if (unmountFiber === node) {
				childrenToDelete.push(unmountFiber)
			}
			node = node.sibling
		}
	}
}

const commitDeletion = (childToDelete: FiberNode, root: FiberRootNode) => {
	// let rootHostNode: FiberNode | null = null
	const rootChildrenToDelete: FiberNode[] = []
	commitNestedComponent(childToDelete, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber)
				// TODO unbind ref

				return
			case HostText:
				recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber)
				return
			case FunctionComponent:
				// TODO useEffect unmount
				commitPassiveEffect(unmountFiber, root, 'unmount')
				return
			default:
				if (__DEV__) {
					console.warn('unfinish unmount type', unmountFiber)
				}
				break
		}
	})
	// remove rootHostNode's dom
	if (rootChildrenToDelete.length) {
		const hostParent = getHostParent(childToDelete)
		if (hostParent) {
			rootChildrenToDelete.forEach((node) => {
				removeChild(node.stateNode, hostParent)
			})
		}
	}

	childToDelete.return = null
	childToDelete.child = null
}

const commitNestedComponent = (
	root: FiberNode,
	onCommitUnmount: (fiber: FiberNode) => void
) => {
	let node = root
	while (true) {
		onCommitUnmount(node)
		if (node.child !== null) {
			node.child.return = node
			node = node.child
			continue
		}
		if (node === root) return
		while (node.sibling === null) {
			if (node.return === null || node.return === root) return

			node = node.return
		}
		node.sibling.return = node.return
		node = node.sibling
	}
}

const commitPlacement = (finishedWork: FiberNode) => {
	// insert dom to parent's dom
	if (__DEV__) {
		console.warn('execute Placement operation')
	}

	const hostParent = getHostParent(finishedWork)
	const sibling = getHostSibling(finishedWork)

	// host sibling
	if (hostParent) {
		insertOrAppendPlacementNodeIntoContainer(finishedWork, hostParent, sibling)
	}
}

const getHostSibling = (fiber: FiberNode) => {
	let node: FiberNode = fiber

	findSibling: while (true) {
		while (node.sibling === null) {
			const parent = node.return

			if (
				parent === null ||
				parent.tag === HostComponent ||
				parent.tag === HostRoot
			) {
				return
			}
			node = parent
		}
		node.sibling.return = node.return
		node = node.sibling

		// <div> sibling <App />
		while (node.tag !== HostText && node.tag !== HostComponent) {
			if ((node.flags & Placement) !== NoFlags) {
				// unstable node
				continue findSibling
			}
			if (node.child === null) {
				continue findSibling
			} else {
				node.child.return = node
				node = node.child
			}
		}
		if ((node.flags & Placement) === NoFlags) {
			return node.stateNode
		}
	}
}

const getHostParent = (fiber: FiberNode): Container | null => {
	let parent = fiber.return
	while (parent) {
		const parentTag = parent.tag
		if (parentTag === HostComponent) {
			return parent.stateNode
		}
		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container
		}
		parent = parent.return
	}
	if (__DEV__) {
		console.warn('can not find host parent')
	}

	return null
}

const insertOrAppendPlacementNodeIntoContainer = (
	finishedWork: FiberNode,
	hostParent: Container,
	before?: Instance
) => {
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		if (before) {
			insertChildToContainer(finishedWork.stateNode, hostParent, before)
		} else {
			appendChildToContainer(hostParent, finishedWork.stateNode)
		}
		return
	}
	const child = finishedWork.child
	if (child !== null) {
		insertOrAppendPlacementNodeIntoContainer(child, hostParent)
		let sibling = child.sibling
		while (sibling !== null) {
			insertOrAppendPlacementNodeIntoContainer(sibling, hostParent)
			sibling = sibling.sibling
		}
	}
}
