import { ReactElementType } from 'shared/ReactTypes'
import { FiberNode } from './fiber'
import { UpdateQueue, processUpdateQueue } from './updateQueue'
import { HostRoot, HostText, HostComponent } from './workTags'
import { reconcileChildFibers, mountChildFibers } from './childFiber'

export const beginWork = (wip: FiberNode) => {
	switch (wip.tag) {
		case HostRoot:
			// 1. update new State
			// 2. return child fiberNode
			return updateHostRoot(wip)
		case HostComponent:
			return updateHostComponent(wip)
		case HostText:
			return null
		default:
			if (__DEV__) {
				console.warn('unknown type by beginWork')
			}
	}
	return null
}

const updateHostRoot = (wip: FiberNode) => {
	const baseState = wip.memorizedState
	const updateQueue = wip.updateQueue as UpdateQueue<Element>
	const pending = updateQueue.shared.pending
	updateQueue.shared.pending = null

	const { memorizedState } = processUpdateQueue(baseState, pending)

	wip.memorizedState = memorizedState

	const nextChildren = wip.memorizedState
	// compare current child fiberNode with child reactElement -> (wip.memorizedState)
	reconcileChildren(wip, nextChildren)
	return wip.child
}

// <div><span /></div> -> div's children -> span
const updateHostComponent = (wip: FiberNode) => {
	const props = wip.pendingProps
	const nextChildren = props.children
	reconcileChildren(wip, nextChildren)
	return wip.child
}

const reconcileChildren = (wip: FiberNode, children?: ReactElementType) => {
	const current = wip.alternate

	if (current !== null) {
		// update
		wip.child = reconcileChildFibers(wip, current?.child, children)
	} else {
		// mount
		wip.child = mountChildFibers(wip, null, children)
	}
}
