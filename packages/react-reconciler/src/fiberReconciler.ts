/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-03 15:22:05
 * @Description:
 */

import { Container } from 'hostConfig'
import { FiberNode, FiberRootNode } from './fiber'
import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate
} from './updateQueue'
import { ReactElementType } from 'shared/ReactTypes'
import { scheduleUpdateOnFiber } from './workLoop'
import { HostRoot } from './workTags'
import { requestUpdateLane } from './fiberLanes'

// ReactDom.createRoot
export const createContainer = (container: Container) => {
	const hostRootFiber = new FiberNode(HostRoot, {}, null)
	const root = new FiberRootNode(container, hostRootFiber)
	hostRootFiber.updateQueue = createUpdateQueue()

	return root
}

// ReactDom.createRoot().render
export const updateContainer = (
	element: ReactElementType | null,
	root: FiberRootNode
) => {
	const hostRootFiber = root.current
	const lane = requestUpdateLane()
	const update = createUpdate<ReactElementType | null>(element, lane)
	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
		update
	)
	scheduleUpdateOnFiber(hostRootFiber, lane)
	return element
}
