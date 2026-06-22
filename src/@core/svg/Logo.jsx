const Logo = props => {
  return (
    <svg width='42' height='26' viewBox='0 0 42 26' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      {/* Monograma L4 — identidade L4 Ativos */}
      <defs>
        <linearGradient id='l4_grad' x1='0' y1='0' x2='42' y2='26' gradientUnits='userSpaceOnUse'>
          <stop stopColor='var(--mui-palette-primary-main)' />
          <stop offset='1' stopColor='var(--mui-palette-primary-dark, var(--mui-palette-primary-main))' />
        </linearGradient>
      </defs>

      {/* Letra L */}
      <path d='M3 1.5H8.2V19.2H17V24H3V1.5Z' fill='url(#l4_grad)' />

      {/* Numeral 4 */}
      <path
        d='M33.4 1.5H28L19.2 15.2V19.4H30.2V24H35.1V19.4H38.6V15H35.1V1.5H33.4ZM30.2 15H24.3L30.2 6.1V15Z'
        fill='var(--mui-palette-primary-main)'
      />
    </svg>
  )
}

export default Logo
