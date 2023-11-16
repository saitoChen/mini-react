/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-07 16:04:55
 * @Description:
 */
import {
	Container,
	appendChildToContainer,
	commitUpdate,
	removeChild
} from 'hostConfig'
import { FiberNode, FiberRootNode } from './fiber'
import {
	MutationMask,
	NoFlags,
	Placement,
	Update,
	ChildDeletion
} from './fiberFlags'
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags'

export const commitMutationEffects = (finishedWork: FiberNode) => {
	let nextEffect = finishedWork

	while (nextEffect !== null) {
		const child = nextEffect.child
		if (
			(nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
			child !== null
		) {
			nextEffect = child
		} else {
			up: while (nextEffect !== null) {
				commitMutationEffectsOnFiber(nextEffect)
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
const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
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
				commitDeletion(childToDelete)
			})
		}
		// remove Placement from flags
		finishedWork.flags &= ~ChildDeletion
	}
}

const commitDeletion = (childToDelete: FiberNode) => {
	let rootHostNode: FiberNode | null = null
	commitNestedComponent(childToDelete, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				if (rootHostNode === null) {
					rootHostNode = unmountFiber
				}
				// TODO unbind ref

				return
			case HostText:
				if (rootHostNode === null) {
					rootHostNode = unmountFiber
				}
				return
			case FunctionComponent:
				// TODO useEffect unmount
				return
			default:
				if (__DEV__) {
					console.warn('unfinish unmount type', unmountFiber)
				}
				break
		}
	})
	// remove rootHostNode's dom
	if (rootHostNode !== null) {
		const hostParent = getHostParent(childToDelete)
		if (hostParent) {
			removeChild((rootHostNode as FiberNode).stateNode, hostParent)
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
	if (hostParent) {
		appendPlacementNodeIntoContainer(finishedWork, hostParent)
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

const appendPlacementNodeIntoContainer = (
	finishedWork: FiberNode,
	hostParent: Container
) => {
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		appendChildToContainer(hostParent, finishedWork.stateNode)
		return
	}
	const child = finishedWork.child
	if (child !== null) {
		appendPlacementNodeIntoContainer(child, hostParent)
		let sibling = child.sibling
		while (sibling !== null) {
			appendPlacementNodeIntoContainer(sibling, hostParent)
			sibling = sibling.sibling
		}
	}
}
