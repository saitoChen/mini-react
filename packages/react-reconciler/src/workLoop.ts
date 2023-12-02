/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-02 19:42:15
 * @Description:
 */
import {
	FiberNode,
	FiberRootNode,
	PendingPassiveEffects,
	createWorkInProgress
} from './fiber'
import { beginWork } from './beginWork'
import { completeWork } from './completeWork'
import { HostRoot } from './workTags'
import { MutationMask, NoFlags, PassiveMask } from './fiberFlags'
import {
	commitHookEffectListCreate,
	commitHookEffectListDestory,
	commitHookEffectListUnmount,
	commitMutationEffects
} from './commitWork'
import {
	Lane,
	NoLane,
	SyncLane,
	getHighestPriorityLane,
	markRootFinished,
	mergeLanes
} from './fiberLanes'
import { flushSyncCallbacks, scheduleSyncCallback } from './syncTaskQueue'
import { scheduleMicroTask } from 'hostConfig'
import {
	unstable_scheduleCallback as scheduleCallback,
	unstable_NormalPriority as NormalPriority
} from 'scheduler'
import { HookHasEffect, Passive } from './hookEffectTags'

let workInProgress: FiberNode | null = null
let wipRootRenderLane: Lane = NoLane
let rootDoesHasPassiveEffects: boolean = false

const prepareFreshStack = (root: FiberRootNode, lane: Lane) => {
	workInProgress = createWorkInProgress(root.current, {})
	wipRootRenderLane = lane
}

export const scheduleUpdateOnFiber = (fiber: FiberNode, lane: Lane) => {
	const root = markUpdateFromFiberToRoot(fiber)
	markRootUpdated(root, lane)
	ensureRootIsScheduled(root)
	// performSyncWorkOnRoot(root)
}

const ensureRootIsScheduled = (root: FiberRootNode) => {
	const updateLane = getHighestPriorityLane(root.pendingLanes)
	if (updateLane === NoLane) return // NoLane === no update
	if (updateLane === SyncLane) {
		// sync priority, use micro task
		if (__DEV__) {
			console.log('in microTask schedule:', updateLane)
		}
		scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane))
		scheduleMicroTask(flushSyncCallbacks)
	} else {
		// use macro task
	}
}

const markRootUpdated = (root: FiberRootNode, lane: Lane) => {
	root.pendingLanes = mergeLanes(root.pendingLanes, lane)
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

export const performSyncWorkOnRoot = (root: FiberRootNode, lane: Lane) => {
	const nextLanes = getHighestPriorityLane(root.pendingLanes)
	if (nextLanes !== SyncLane) {
		ensureRootIsScheduled(root)
		return
	}
	// initialize workInProgress
	prepareFreshStack(root, lane)

	do {
		try {
			workLoop()
			break
		} catch (_err) {
			if (__DEV__) {
				console.warn('workLoop发生错误')
			}
			workInProgress = null
		}
	} while (true)

	const finishedWork = root.current.alternate
	// finishedWork is wip
	root.finishedWork = finishedWork
	root.finishedLane = lane
	wipRootRenderLane = NoLane

	commitRoot(root)
}

const commitRoot = (root: FiberRootNode) => {
	// 1. switch fiber tree
	// 2. execute Placement operation
	const finishedWork = root.finishedWork
	if (finishedWork === null) return
	if (__DEV__) console.warn('commit start', finishedWork)

	const lane = root.finishedLane

	if (lane === NoLane && __DEV__) {
		console.warn('There is not supposed to be NoLane at commit stage')
	}

	// reset
	root.finishedWork = null
	root.finishedLane = NoLane

	markRootFinished(root, lane)

	if (
		(finishedWork.flags & PassiveMask) !== NoFlags ||
		(finishedWork.subtreeFlags & PassiveMask) !== NoFlags
	) {
		if (!rootDoesHasPassiveEffects) {
			rootDoesHasPassiveEffects = true
			scheduleCallback(NormalPriority, () => {
				// execute effect
				flushPassiveEffects(root.pendingPassiveEffects)
				return
			})
		}
	}

	const subtreeHasEffect =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags
	// have effect
	if (subtreeHasEffect || rootHasEffect) {
		// beforeMutation
		// mutation

		// switch fiber tree
		// hostRootNode
		commitMutationEffects(finishedWork, root)
		root.current = finishedWork
		// layout
	} else {
		root.current = finishedWork
	}

	rootDoesHasPassiveEffects = false
	ensureRootIsScheduled(root)
}

const flushPassiveEffects = (pendingPassiveEffects: PendingPassiveEffects) => {
	pendingPassiveEffects.unmount.forEach((effect) => {
		commitHookEffectListUnmount(Passive, effect)
	})
	pendingPassiveEffects.unmount = []

	pendingPassiveEffects.update.forEach((effect) => {
		commitHookEffectListDestory(Passive | HookHasEffect, effect)
	})
	pendingPassiveEffects.update.forEach((effect) => {
		commitHookEffectListCreate(Passive | HookHasEffect, effect)
	})
	pendingPassiveEffects.update = []
	flushSyncCallbacks()
}

const workLoop = () => {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress)
	}
}

const performUnitOfWork = (fiber: FiberNode) => {
	const next = beginWork(fiber, wipRootRenderLane)
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
