/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-07 23:49:02
 * @Description:
 */
import reactDomConfig from './react-dom.config'
import reactConfig from './react.config'

export default () => {
	return [...reactDomConfig, ...reactConfig]
}
