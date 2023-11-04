export type Type = any
export type Key = any
export type Ref = any
export type Props = any
export type ElementType = any

export interface ReactElementType {
	$$typeof: symbol | number
	type: Type
	key: Key
	ref: Ref
	props: Props
	__marks?: string
}

export type Action<State> = State | ((preState: State) => State)
