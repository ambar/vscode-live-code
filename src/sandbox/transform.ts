import * as recast from 'recast'
import {types} from 'recast'
import getBabelOptions, {Overrides} from 'recast/parsers/_babel_options'
import {parse as babelParse} from '@babel/parser'

function parse(source: string, options?: Overrides) {
  const babelOptions = getBabelOptions(options)
  babelOptions.plugins.push('typescript', 'jsx')
  return babelParse(source, babelOptions)
}

const b = recast.types.builders

type Program = {
  body: types.ASTNode[]
}

const transformAst = (ast: Program, expando = '__onexpression__') => {
  const wrapExpression = (node: recast.types.ASTNode) => {
    if (node.type === 'ExpressionStatement') {
      const exp = node as types.namedTypes.ExpressionStatement
      const context = b.objectExpression([
        b.objectProperty.from({
          key: b.identifier('line'),
          value: b.numericLiteral(exp.loc!.start.line),
        }),
        b.objectProperty.from({
          key: b.identifier('column'),
          value: b.numericLiteral(exp.loc!.start.column),
        }),
      ])
      return b.expressionStatement(
        b.callExpression(b.identifier(expando), [exp.expression, context])
      )
    }
    return node
  }
  const newAst = {
    ...ast,
    body: ast.body
      .map(wrapExpression)
      .concat(
        b.expressionStatement(
          b.callExpression(b.identifier('__onexpressionend__'), [])
        )
      ),
  } as Program

  return newAst
}

const transform = (code: string, expando?: string) => {
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  const newAst = transformAst(
    recast.parse(code, {parser: {parse}}).program as Program,
    expando
  )
  // TODO: add sourcemap
  return recast.print(newAst as unknown as types.ASTNode).code
}

export default transform
