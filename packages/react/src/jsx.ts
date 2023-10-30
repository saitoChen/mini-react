/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-10-30 15:34:57
 * @Description:
 */
import {
	Type,
	Key,
	Ref,
	Props,
	ReactElementType,
	ElementType
} from 'shared/ReactTypes'
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'

const ReactElement = (
	type: Type,
	key: Key,
	ref: Ref,
	props: Props
): ReactElementType => {
	const element = {
		$$typeof: REACT_ELEMENT_TYPE,
		type,
		key,
		ref,
		props,
		__marks: 'jeff'
	}

	return element
}

export const jsx = (
	type: ElementType,
	config: any,
	...maybeChildren: any[]
) => {
	const props: Props = {}
	let key: Key = null
	let ref: Ref = null

	// handle properties
	for (const prop in config) {
		const val = props[prop]
		if (prop === 'key') {
			if (val !== undefined) {
				key = val
			}
			continue
		}
		if (prop === 'ref') {
			if (val !== undefined) {
				ref = val
			}
			continue
		}
		if (Object.prototype.hasOwnProperty.call(config, prop)) {
			props[prop] = val
		}
	}

	handleChildren(maybeChildren, props)

	return ReactElement(type, key, ref, props)
}

const handleChildren = (children: any[], props: any) => {
	const maybeChildrenLength = children.length
	if (maybeChildrenLength) {
		if (maybeChildrenLength === 1) {
			props.children = children[0]
		} else {
			props.children = children
		}
	}
}

export const jsxDev = jsx