/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-02 19:38:35
 * @Description:
 */
import {
	createInstance,
	appendInitialChild,
	createTextInstance,
	Container
} from 'hostConfig'
import { FiberNode } from './fiber'
import {
	HostComponent,
	HostRoot,
	HostText,
	FunctionComponent
} from './workTags'
import { NoFlags, Update } from './fiberFlags'
import { updateFiberProps } from 'react-dom/src/SyntheticEvents'

const markUpdate = (fiber: FiberNode) => {
	fiber.flags |= Update
}

export const completeWork = (wip: FiberNode) => {
	const newProps = wip.pendingProps
	const current = wip.alternate
	switch (wip.tag) {
		case HostRoot:
			bubbleProperties(wip)
			return null
		case HostComponent:
			if (current !== null && wip.stateNode) {
				// update
				updateFiberProps(wip.stateNode, newProps)
			} else {
				// 1. create Dom 2. insert dom
				// 				const instance = createInstance(wip.type, newProps)
				const instance = createInstance(wip.type, newProps)
				appendAllChildren(instance, wip)
				wip.stateNode = instance
			}
			bubbleProperties(wip)
			return null
		case HostText:
			if (current !== null && wip.stateNode) {
				const oldText = current.memorizedProps?.content
				const newText = newProps.content
				if (oldText !== newText) {
					markUpdate(wip)
				}
			} else {
				const instance = createTextInstance(newProps.content)
				wip.stateNode = instance
			}
			bubbleProperties(wip)
			return null
		case FunctionComponent:
			bubbleProperties(wip)
			return null
		default:
			if (__DEV__) {
				console.warn('unknown completeWork')
			}
			break
	}
}

const appendAllChildren = (parent: Container, wip: FiberNode) => {
	let node = wip.child
	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			appendInitialChild(parent, node?.stateNode)
		} else if (node.child !== null) {
			node.child.return = node
			node = node.child
			continue
		}

		if (node === wip) return

		while (node.sibling === null) {
			if (node.return === null || node.return === wip) {
				return
			}
			node = node.return
		}
		node.sibling.return = node.return
		node = node.sibling
	}
}

const bubbleProperties = (wip: FiberNode) => {
	let subtreeFlags = NoFlags
	let child = wip.child

	while (child !== null) {
		subtreeFlags |= child.subtreeFlags
		subtreeFlags |= child.flags

		child.return = wip
		child = child.sibling
	}

	wip.subtreeFlags |= subtreeFlags
}
