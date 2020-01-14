const first = xs => xs[0]
const rest = xs => xs.slice(1)

const sum = xs =>
    xs.length === 0
        ? 0
        : first(xs) + sum(rest(xs));

console.log(sum([1,2,3]))
