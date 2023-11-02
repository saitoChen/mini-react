/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-02 19:42:15
 * @Description:
 */
import { FiberNode } from './fiber'
import { beginWork } from './beginWork'
import { completeWork } from './completeWork'

let workInProgress: FiberNode | null = null

const prepareFreshStack = (fiber: FiberNode) => {
	workInProgress = fiber
}

export const renderRoot = (root: FiberNode) => {
	// initialize workInProgress
	prepareFreshStack(root)

	do {
		try {
			workLoop()
			break
		} catch (_err) {
			console.warn('workLoop发生错误')
			workInProgress = null
		}
	} while (true)
}

const workLoop = () => {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress)
	}
}

const performUnitOfWork = (fiber: FiberNode) => {
	const next = beginWork(fiber)
	fiber.memorizedProps = fiber.pendingProps

	if (next === null) {
		completeUnitOfWork(fiber)
	} else {
		workInProgress = next
	}
}

const completeUnitOfWork = (fiber: FiberNode) => {
	let node: FiberNode | null = fiber
	do {
		completeWork(node)
		const sibling = node.sibling
		if (sibling !== null) {
			workInProgress = sibling
			return
		}
		node = node.return
		workInProgress = node
	} while (node !== null)
}
