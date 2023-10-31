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

// get package.json‘s name
const { name, module } = getPackageJSON('react')
const pkgPath = resolvePackagePath(name)
const pkgDistPath = resolvePackagePath(name, true)

export default [
	// react
	{
		input: `${pkgPath}/${module}`,
		output: {
			file: `${pkgDistPath}/index.js`,
			name: 'index.js',
			format: 'umd'
		},
		plugins: [
			...getBaseRollupPlugin(),
			generatePackageJson({
				inputFolder: pkgPath,
				outputFolder: pkgDistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					// because format setting is umd, so use main property
					main: 'index.js'
				})
			})
		]
	},
	{
		input: `${pkgPath}/src/jsx.ts`,
		output: [
			// jsx-runtime.js
			{
				file: `${pkgDistPath}/jsx-runtime.js`,
				name: 'jsx-runtime.js',
				format: 'umd'
			},
			// jsx-dev-runtime.js
			{
				file: `${pkgDistPath}/jsx-dev-runtime.js`,
				name: 'jsx-dev-runtime.js',
				format: 'umd'
			}
		],
		plugins: getBaseRollupPlugin()
	}
]
