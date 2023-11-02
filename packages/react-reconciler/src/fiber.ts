/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-02 18:56:36
 * @Description: fiber structure
 */

import { Props, Key, Ref } from 'shared/ReactTypes'
import { WorkTag } from './workTags'
import { Flags, NoFlags } from './fiberFlags'

export class FiberNode {
	type: any
	key: Key
	tag: WorkTag
	stateNode: any
	pendingProps: Props
	memorizedProps: Props | null

	return: FiberNode | null
	sibling: FiberNode | null
	child: FiberNode | null
	index: number
	ref: Ref

	alternate: FiberNode | null
	flags: Flags

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

		this.alternate = null
		// effect
		this.flags = NoFlags
	}
}
