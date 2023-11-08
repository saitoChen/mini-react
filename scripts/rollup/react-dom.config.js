/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-10-31 21:46:27
 * @Description:
 */
import {
	resolvePackagePath,
	getPackageJSON,
	getBaseRollupPlugin
} from './utils.js'
import generatePackageJson from 'rollup-plugin-generate-package-json'
import alias from '@rollup/plugin-alias'

// get package.json‘s name
const { name, module } = getPackageJSON('react-dom')
const pkgPath = resolvePackagePath(name)
const pkgDistPath = resolvePackagePath(name, true)

export default [
	// react-dom
	{
		input: `${pkgPath}/${module}`,
		output: [
			{
				file: `${pkgDistPath}/index.js`,
				name: 'index.js',
				format: 'umd'
			},
			{
				file: `${pkgDistPath}/client.js`,
				name: 'client.js',
				format: 'umd'
			}
		],
		plugins: [
			...getBaseRollupPlugin(),
			alias({
				entries: {
					hostConfig: `${pkgPath}/src/hostConfig.ts`
				}
			}),
			generatePackageJson({
				inputFolder: pkgPath,
				outputFolder: pkgDistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					peerDependencies: {
						react: version
					},
					// because format setting is umd, so use main property
					main: 'index.js'
				})
			})
		]
	}
]
