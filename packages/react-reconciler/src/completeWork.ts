import {
	createInstance,
	appendInitialChild,
	createTextInstance
} from 'hostConfig'
import { FiberNode } from './fiber'
import { HostComponent, HostRoot, HostText } from './workTags'
import { NoFlags } from './fiberFlags'

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
			} else {
				// 1. create Dom 2. insert dom
				const instance = createInstance(wip.type, newProps)
				appendAllChildren(instance, wip)
				wip.stateNode = instance
			}
			bubbleProperties(wip)
			return null
		case HostText:
			const instance = createTextInstance(newProps.content)
			wip.stateNode = instance
			bubbleProperties(wip)
			return null
		default:
			if (__DEV__) {
				console.warn('unknown completeWork')
			}
			break
	}
}

const appendAllChildren = (parent: FiberNode, wip: FiberNode) => {
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
