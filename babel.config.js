module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                node: 'current',
            },
        }],
    ],
    env: {
        development: {
            presets: ['babel-preset-vue'],
        },
        production: {
            presets: ['babel-preset-vue'],
        },
        test: {
            presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
        },
    },
};
