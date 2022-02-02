module.exports = {
  content: ['./apps/eworkbench/**/*.{html,ts,css,scss,sass,less,styl}', './libs/**/*.{html,ts,css,scss,sass,less,styl}'],
  important: true,
  theme: {
    extend: {
      colors: {
        tum: {
          primary: {
            DEFAULT: '#3070b3',
            hover: '#235488',
          },
          secondary: {
            DEFAULT: '#f4f4f4',
            hover: '#e6e6e6',
          },
          highlight: {
            DEFAULT: '#f3f9ff',
          },
          'info-color': {
            DEFAULT: '#595959',
          },
          border: {
            gray: '#e6e6e6',
            gray2: '#c8c8c8',
          },
        },
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
