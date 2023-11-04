/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-02 19:42:15
 * @Description:
 */
import { FiberNode, FiberRootNode, crateWorkInProgress } from './fiber'
import { beginWork } from './beginWork'
import { completeWork } from './completeWork'
import { HostRoot } from './workTags'

let workInProgress: FiberNode | null = null

const prepareFreshStack = (root: FiberRootNode) => {
	workInProgress = crateWorkInProgress(root.current, {})
}

export const scheduleUpdateOnFiber = (fiber: FiberNode) => {
	const root = markUpdateFromFiberToRoot(fiber)
	renderRoot(root)
}

const markUpdateFromFiberToRoot = (fiber: FiberNode) => {
	let node = fiber
	let parent = node.return
	while (parent !== null) {
		node = parent
		parent = node.return
	}
	if (node.tag === HostRoot) {
		return node.stateNode
	}
	return null
}

export const renderRoot = (root: FiberRootNode) => {
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
