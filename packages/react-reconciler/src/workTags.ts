/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-02 18:58:58
 * @Description:
 */

export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText
	| typeof Fragment

export const FunctionComponent = 0
// root
export const HostRoot = 3

// <div></div> -> div
export const HostComponent = 5
export const HostText = 6
export const Fragment = 7
