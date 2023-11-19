import { Container } from 'hostConfig'
import { Props } from 'shared/ReactTypes'

type EventCallback = (e: Event) => void

interface Paths {
	capture: EventCallback[]
	buble: EventCallback[]
}

interface SyntheticEvents extends Event {
	__stopPropagation: boolean
}

export const elementPropsKey = '__props'
const validEventTypeList = ['click']
export interface DOMElement extends Element {
	[elementPropsKey]: Props
}

export const updateFiberProps = (node: DOMElement, props: Props) => {
	node[elementPropsKey] = props
}

export const initEvent = (container: Container, eventType: string) => {
	if (!validEventTypeList.includes(eventType)) {
		console.warn('can not support type', eventType)
		return
	}
	if (__DEV__) {
		console.log('init event', eventType)
	}
	container.addEventListener(eventType, (e) => {
		dispatchEvent(container, eventType, e)
	})
}

const createSyntheticEvent = (e: Event) => {
	const syntheticEvents = e as SyntheticEvents
	syntheticEvents.__stopPropagation = false

	const originPropagation = e.stopPropagation
	syntheticEvents.stopPropagation = () => {
		syntheticEvents.__stopPropagation = true
		if (originPropagation) {
			originPropagation()
		}
	}

	return syntheticEvents
}

const triggerEventFlow = (paths: EventCallback[], se: SyntheticEvents) => {
	for (let i = 0; i < paths.length; i++) {
		const callback = paths[i]
		callback.call(null, se)

		if (se.__stopPropagation) {
			break
		}
	}
}

const dispatchEvent = (container: Container, eventType: string, e: Event) => {
	const targetElement = e.target
	if (targetElement === null) {
		console.warn('not exist target', e)
		return
	}

	// collect event
	const { buble, capture } = collectPaths(
		targetElement as DOMElement,
		container,
		eventType
	)
	// create synthetic event
	const se = createSyntheticEvent(e)
	triggerEventFlow(capture, se)

	if (!se.__stopPropagation) {
		triggerEventFlow(buble, se)
	}
}

const getEvenetCallbackNameFromEventType = (
	eventType: string
): string[] | undefined => {
	return {
		click: ['onClickCapture', 'onClick']
	}[eventType]
}

const collectPaths = (
	targetElement: DOMElement,
	container: Container,
	eventType: string
) => {
	const paths: Paths = {
		capture: [],
		buble: []
	}

	while (targetElement !== null && targetElement !== container) {
		// collect
		const elementProps = targetElement[elementPropsKey]
		if (elementProps) {
			// click -> onClick, onClickCapture
			const callbackNameList = getEvenetCallbackNameFromEventType(eventType)
			if (callbackNameList) {
				callbackNameList.forEach((callbackName, i) => {
					const eventCallback = elementProps[callbackName]
					if (eventCallback) {
						if (i === 0) {
							// capture
							paths.capture.unshift(eventCallback)
						} else {
							paths.buble.push(eventCallback)
						}
					}
				})
			}
		}

		targetElement = targetElement.parentNode as DOMElement
	}

	return paths
}
