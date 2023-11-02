/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-02 19:28:10
 * @Description:
 */
export type Flags = number

export const NoFlags = 0b0000001
export const Placement = 0b0000010
export const Update = 0b0000100
export const ChildDeletion = 0b0010000
