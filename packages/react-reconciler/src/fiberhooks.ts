import { Dispatch, Dispatcher } from 'react/src/currentDispatcher'
import { FiberNode } from './fiber'
import internals from 'shared/internals'
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
	UpdateQueue
} from './updateQueue'
import { scheduleUpdateOnFiber } from './workLoop'
import { Action } from 'shared/ReactTypes'
import { Lane, NoLane, requestUpdateLane } from './fiberLanes'
import { Flags, PassiveEffect } from './fiberFlags'
import { HookHasEffect, Passive } from './hookEffectTags'

let currentlyRenderFiber: FiberNode | null = null
let workInProgressHook: Hook | null = null
let currentHook: Hook | null = null
let renderLane: Lane = NoLane

console.log('internals ->', internals)

const { currentDispatcher } = internals

interface Hook {
	memorizedState: any
	updateQueue: unknown
	next: Hook | null
}
export interface Effect {
	tag: Flags
	create: EffectCallback | void
	destory: EffectCallback | void
	deps: EffectDeps
	next: Effect | null
}

export interface FCUpdateQueue<State> extends UpdateQueue<State> {
	lastEffect: Effect | null
}

type EffectCallback = () => void
type EffectDeps = any[] | null

export const renderWithHooks = (wip: FiberNode, lane: Lane) => {
	currentlyRenderFiber = wip
	wip.memorizedState = null
	renderLane = lane
	const current = wip.alternate

	if (current !== null) {
		// update
		currentDispatcher.current = HookDispatcherOnUpdate
	} else {
		// mount
		currentDispatcher.current = HookDispatcherOnMount
	}

	// FunctionComponent
	const Component = wip.type
	const props = wip.pendingProps

	const children = Component(props)

	currentlyRenderFiber = null
	workInProgressHook = null
	currentHook = null
	renderLane = NoLane
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
	hook.memorizedState = memorizedState
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
	const lane = requestUpdateLane()
	const update = createUpdate(action, lane)
	enqueueUpdate(updateQueue, update)
	scheduleUpdateOnFiber(fiber, lane)
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

const updateState = <State>(): [State, Dispatch<State>] => {
	const hook = updateWorkInProgressHook()

	// calculate state
	const queue = hook.updateQueue as UpdateQueue<State>
	const pending = queue.shared.pending
	queue.shared.pending = null

	if (pending !== null) {
		const { memorizedState } = processUpdateQueue(
			hook.memorizedState,
			pending,
			renderLane
		)
		hook.memorizedState = memorizedState
	}

	return [hook.memorizedState, queue.dispatch as Dispatch<State>]
}

const mountEffect = (
	create: EffectCallback | void,
	deps: EffectDeps | void
) => {
	const hook = mountWorkInProgressHook()
	const nextDeps = deps === undefined ? null : deps

	;(currentlyRenderFiber as FiberNode).flags |= PassiveEffect

	hook.memorizedState = pushEffect(
		Passive | HookHasEffect,
		create,
		undefined,
		nextDeps
	)
}

const HookDispatcherOnMount: Dispatcher = {
	useState: mountState,
	useEffect: mountEffect
}

const HookDispatcherOnUpdate: Dispatcher = {
	useState: updateState,
	useEffect: mountEffect
}

const pushEffect = (
	hookFlags: Flags,
	create: EffectCallback | void,
	destory: EffectCallback | void,
	deps: EffectDeps
): Effect => {
	const effect: Effect | null = {
		tag: hookFlags,
		create,
		destory,
		deps,
		next: null
	}
	const fiber = currentlyRenderFiber as FiberNode
	const updateQueue = fiber.updateQueue as FCUpdateQueue<any>

	if (updateQueue === null) {
		const updateQueue = createFCUpdateQueue()
		fiber.updateQueue = updateQueue
		effect.next = effect
		updateQueue.lastEffect = effect
	} else {
		const lastEffect = updateQueue.lastEffect
		if (lastEffect === null) {
			effect.next = effect
			updateQueue.lastEffect = effect
		} else {
			const firstEffect = lastEffect.next
			lastEffect.next = effect
			effect.next = firstEffect
			updateQueue.lastEffect = effect
		}
	}
	return effect
}

const createFCUpdateQueue = <State>() => {
	const updateQueue = createUpdateQueue<State>() as FCUpdateQueue<State>
	updateQueue.lastEffect = null
	return updateQueue
}

const updateWorkInProgressHook = (): Hook => {
	let nextCurrentHook: Hook | null
	if (currentHook === null) {
		// the first hook
		const current = currentlyRenderFiber?.alternate
		if (current !== null) {
			nextCurrentHook = current?.memorizedState
		} else {
			nextCurrentHook = null
		}
	} else {
		// the subsequent hook
		nextCurrentHook = currentHook.next
	}

	if (nextCurrentHook === null) {
		throw new Error('hook error ( maybe hook in a if block )')
	}

	currentHook = nextCurrentHook as Hook

	const newHook: Hook = {
		memorizedState: currentHook.memorizedState,
		updateQueue: currentHook.updateQueue,
		next: null
	}
	if (workInProgressHook === null) {
		if (currentlyRenderFiber === null) {
			throw new Error('create hook error')
		} else {
			workInProgressHook = newHook
			currentlyRenderFiber.memorizedState = workInProgressHook
		}
	} else {
		workInProgressHook.next = newHook
		workInProgressHook = newHook
	}

	return workInProgressHook
}
