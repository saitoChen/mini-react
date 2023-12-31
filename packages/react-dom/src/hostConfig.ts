/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-07 22:25:32
 * @Description:
 */
import { FiberNode } from 'react-reconciler/src/fiber'
import { HostText } from 'react-reconciler/src/workTags'
import { Props } from 'shared/ReactTypes'
import { DOMElement, updateFiberProps } from './SyntheticEvents'

export type Container = Element
export type Instance = Element
export type TextInstance = Text

// export const createInstance = (type: string, props: any): Instance => {
export const createInstance = (type: string, props: Props): Instance => {
	const element = document.createElement(type)
	updateFiberProps(element as unknown as DOMElement, props)
	return element
}

export const commitUpdate = (fiber: FiberNode) => {
	switch (fiber.tag) {
		case HostText:
			const text = fiber.memorizedProps?.content
			return commitTextUpdate(fiber.stateNode, text)

		default:
			if (__DEV__) {
				console.warn('unfinish Update type', fiber)
			}
			break
	}
}

export const commitTextUpdate = (
	textInstance: TextInstance,
	content: string
) => {
	textInstance.textContent = content
}

export const appendInitialChild = (
	parent: Instance | Container,
	child: Instance
) => {
	parent.appendChild(child)
}

export const createTextInstance = (content: string) => {
	return document.createTextNode(content)
}

export const removeChild = (
	child: Instance | TextInstance,
	container: Container
) => {
	container.removeChild(child)
}

export const appendChildToContainer = appendInitialChild

export const insertChildToContainer = (
	child: Instance,
	container: Container,
	before: Instance
) => {
	container.insertBefore(child, before)
}

export const scheduleMicroTask =
	typeof queueMicrotask === 'function'
		? queueMicrotask
		: typeof Promise === 'function'
		? (callback: (...args: any) => void) => Promise.resolve(null).then(callback)
		: setTimeout
