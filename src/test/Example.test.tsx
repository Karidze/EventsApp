test('adds numbers correctly', () => {
  const sum = (a: number, b: number) => a + b;
  expect(sum(2, 3)).toBe(5);
});