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

// ReactDom.createRoot
export const createContainer = (container: Container) => {
	const hostRootFiber = new FiberNode(container, {}, null)
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
	const update = createUpdate<ReactElementType | null>(element)
	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
		update
	)
	scheduleUpdateOnFiber(hostRootFiber)
	return element
}
