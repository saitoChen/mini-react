/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-02 18:56:36
 * @Description: fiber structure
 */

import { Props, Key, Ref, ReactElementType } from 'shared/ReactTypes'
import { FunctionComponent, HostComponent, WorkTag } from './workTags'
import { Flags, NoFlags } from './fiberFlags'
import { Container } from 'hostConfig'

export class FiberNode {
	type: any
	key: Key
	tag: WorkTag
	stateNode: any
	pendingProps: Props
	memorizedProps: Props | null
	memorizedState: any
	updateQueue: unknown
	deletions: FiberNode[] | null

	return: FiberNode | null
	sibling: FiberNode | null
	child: FiberNode | null
	index: number
	ref: Ref

	alternate: FiberNode | null
	flags: Flags
	subtreeFlags: Flags

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		this.key = key
		this.tag = tag

		this.stateNode = null // store real dom
		this.type = null

		this.return = null
		this.sibling = null
		this.child = null
		this.index = 0 // childNodes index

		this.ref = null

		this.pendingProps = pendingProps
		this.memorizedProps = null
		this.updateQueue = null
		this.memorizedState = null
		this.deletions = null

		this.alternate = null
		// effect
		this.flags = NoFlags
		this.subtreeFlags = NoFlags
	}
}

export class FiberRootNode {
	container: Container // base on different environment
	current: FiberNode // FiberRootNode.current -> hostRootFiber  hostRootFiber.stateNode -> FiberRootNode
	finishedWork: FiberNode | null
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container
		this.current = hostRootFiber
		hostRootFiber.stateNode = this
		this.finishedWork = null
	}
}

export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	let wip = current.alternate
	if (wip === null) {
		// mount
		wip = new FiberNode(current.tag, pendingProps, current.key)
		wip.stateNode = current.stateNode

		wip.alternate = current
		current.alternate = wip
	} else {
		// update
		wip.pendingProps = pendingProps
		// reset effect
		wip.flags = NoFlags
		wip.subtreeFlags = NoFlags
		wip.deletions = null
	}

	wip.type = current.type
	wip.updateQueue = current.updateQueue
	wip.child = current.child
	wip.memorizedProps = current.memorizedProps
	wip.memorizedState = current.memorizedState
	return wip
}

export const createFiberFromElement = (element: ReactElementType) => {
	const { type, key, props } = element
	let fiberTag: WorkTag = FunctionComponent
	if (typeof type === 'string') {
		// div
		fiberTag = HostComponent
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('unknown type', element)
	}

	const fiber = new FiberNode(fiberTag, props, key)
	fiber.type = type

	return fiber
}
