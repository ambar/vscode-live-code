import transform from '../transform'

test('transform expressions', () => {
  expect(transform(`0;1\n2`)).toMatchInlineSnapshot(`
    "__onexpression__(0, {
      line: 1,
      column: 0
    });

    __onexpression__(1, {
      line: 1,
      column: 2
    });

    __onexpression__(2, {
      line: 2,
      column: 0
    });

    __onexpressionend__();"
  `)
})

test('empty', () => {
  expect(transform(``)).toMatchInlineSnapshot(`"__onexpressionend__();"`)
})

test('jsx', () => {
  expect(transform(`<div />`)).toMatchInlineSnapshot(`
    "__onexpression__(<div />, {
      line: 1,
      column: 0
    });

    __onexpressionend__();"
  `)
})

test('ts', () => {
  expect(transform(`type c = 0;1;<div />`)).toMatchInlineSnapshot(`
    "type c = 0;

    __onexpression__(1, {
      line: 1,
      column: 11
    });

    __onexpression__(<div />, {
      line: 1,
      column: 13
    });

    __onexpressionend__();"
  `)
})
