import { Dispatch, Dispatcher } from 'react/src/currentDispatcher'
import { FiberNode } from './fiber'
import internals from 'shared/internals'
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	UpdateQueue
} from './updateQueue'
import { scheduleUpdateOnFiber } from './workLoop'
import { Action } from 'shared/ReactTypes'

let currentlyRenderFiber: FiberNode | null = null
let workInProgressHook: Hook | null = null

console.log('internals ->', internals)

const { currentDispatcher } = internals

interface Hook {
	memorizedState: any
	updateQueue: unknown
	next: Hook | null
}

export const renderWithHooks = (wip: FiberNode) => {
	currentlyRenderFiber = wip
	wip.memorizedState = null

	const current = wip.alternate

	if (current !== null) {
		// update
	} else {
		// mount
		currentDispatcher.current = HookDispatcherOnMount
	}

	// FunctionComponent
	const Component = wip.type
	const props = wip.pendingProps

	const children = Component(props)

	currentlyRenderFiber = null
	return children
}

const mountState = <State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] => {
	const hook = mountWorkInProgressHook()
	let memorizedState

	if (initialState instanceof Function) {
		memorizedState = initialState()
	} else {
		memorizedState = initialState
	}

	const queue = createUpdateQueue<State>()
	hook.updateQueue = queue

	// @ts-ignore
	const dispatch = dispatchSetState.bind(null, currentlyRenderFiber!, queue)
	queue.dispatch = dispatch

	return [memorizedState, dispatch]
}

const dispatchSetState = <State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) => {
	const update = createUpdate(action)
	enqueueUpdate(updateQueue, update)
	scheduleUpdateOnFiber(fiber)
}

const mountWorkInProgressHook = (): Hook => {
	const hook: Hook = {
		memorizedState: null,
		updateQueue: null,
		next: null
	}
	if (workInProgressHook === null) {
		if (currentlyRenderFiber === null) {
			throw new Error('create hook error')
		} else {
			workInProgressHook = hook
			currentlyRenderFiber.memorizedState = workInProgressHook
		}
	} else {
		workInProgressHook.next = hook
		workInProgressHook = hook
	}

	return workInProgressHook
}

const HookDispatcherOnMount: Dispatcher = {
	useState: mountState
}
