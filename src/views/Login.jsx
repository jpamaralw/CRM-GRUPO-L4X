'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'

// Third-party Imports
import { signIn } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, minLength, string, email, pipe, nonEmpty } from 'valibot'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const schema = object({
  email: pipe(string(), minLength(1, 'Informe seu e-mail'), email('Informe um e-mail válido')),
  password: pipe(string(), nonEmpty('Informe sua senha'), minLength(5, 'A senha deve ter ao menos 5 caracteres'))
})

const TRUST = [
  { icon: 'ri-shield-check-line', label: 'Desde 2018 no mercado' },
  { icon: 'ri-exchange-funds-line', label: '+11 mil antecipações realizadas' },
  { icon: 'ri-bank-line', label: '+R$ 3 bilhões em processos geridos' }
]

const Login = () => {
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [errorState, setErrorState] = useState(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang: locale } = useParams()

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: { email: '', password: '' }
  })

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const onSubmit = async data => {
    setLoading(true)

    const res = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false
    })

    setLoading(false)

    if (res && res.ok && res.error === null) {
      const redirectURL = searchParams.get('redirectTo') ?? '/'

      router.replace(getLocalizedUrl(redirectURL, locale))
    } else if (res?.error) {
      try {
        setErrorState(JSON.parse(res.error))
      } catch {
        setErrorState({ message: ['E-mail ou senha inválidos'] })
      }
    }
  }

  return (
    <div className='flex bs-full min-bs-[100dvh]'>
      {/* Painel de marca */}
      <div
        className='relative flex-1 flex-col justify-between p-12 max-md:hidden md:flex overflow-hidden'
        style={{
          background:
            'radial-gradient(1200px 600px at 20% -10%, #0a5bc4 0%, transparent 60%), linear-gradient(135deg, #002a66 0%, #004499 55%, #00367d 100%)'
        }}
      >
        {/* losango sutil de fundo */}
        <div
          aria-hidden
          className='absolute -right-24 -bottom-24 opacity-10'
          style={{ width: 460, height: 460, border: '40px solid #fff', transform: 'rotate(45deg)', borderRadius: 24 }}
        />
        <div className='relative flex items-center'>
          <img src='/images/brand/l4-ativos-horizontal-white.png' alt='L4 Ativos' style={{ height: 40 }} />
        </div>

        <div className='relative flex flex-col gap-4 max-is-[460px]'>
          <Typography variant='h3' className='text-white font-bold leading-tight'>
            Antecipe seu crédito judicial com segurança.
          </Typography>
          <Typography className='text-white/80'>
            CRM do Grupo L4 — prospecção, negociação e acompanhamento processual de precatórios, RPV e ativos
            tributários em um só lugar.
          </Typography>

          <div className='flex flex-col gap-3 mt-4'>
            {TRUST.map(t => (
              <div key={t.label} className='flex items-center gap-3 text-white/90'>
                <span
                  className='flex items-center justify-center rounded-lg'
                  style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.12)' }}
                >
                  <i className={`${t.icon} text-[20px]`} />
                </span>
                <Typography className='text-white/90 font-medium'>{t.label}</Typography>
              </div>
            ))}
          </div>
        </div>

        <Typography className='relative text-white/50 text-sm'>Grupo L4 · L4 Ativos · L4 Taxx</Typography>
      </div>

      {/* Formulário */}
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset]'>
          <div className='flex flex-col items-start gap-2 md:hidden'>
            <img src='/images/brand/l4-ativos-horizontal.png' alt='L4 Ativos' style={{ height: 40 }} />
          </div>

          <div>
            <Typography variant='h4' className='font-semibold'>
              Bem-vindo de volta 👋
            </Typography>
            <Typography color='text.secondary'>Acesse o CRM do Grupo L4 para continuar.</Typography>
          </div>

          {errorState && (
            <Alert severity='error' onClose={() => setErrorState(null)}>
              {errorState?.message?.[0] || 'E-mail ou senha inválidos'}
            </Alert>
          )}

          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <Controller
              name='email'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  autoFocus
                  type='email'
                  label='E-mail corporativo'
                  placeholder='nome@l4ativos.com.br'
                  onChange={e => {
                    field.onChange(e.target.value)
                    errorState !== null && setErrorState(null)
                  }}
                  {...(errors.email && { error: true, helperText: errors?.email?.message })}
                />
              )}
            />
            <Controller
              name='password'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Senha'
                  id='login-password'
                  type={isPasswordShown ? 'text' : 'password'}
                  onChange={e => {
                    field.onChange(e.target.value)
                    errorState !== null && setErrorState(null)
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onClick={handleClickShowPassword}
                            onMouseDown={e => e.preventDefault()}
                            aria-label='mostrar senha'
                          >
                            <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                  {...(errors.password && { error: true, helperText: errors.password.message })}
                />
              )}
            />
            <div className='flex justify-between items-center flex-wrap gap-x-3 gap-y-1'>
              <FormControlLabel control={<Checkbox defaultChecked />} label='Lembrar de mim' />
              <Typography
                className='text-end'
                color='primary.main'
                component={Link}
                href={getLocalizedUrl('/forgot-password', locale)}
              >
                Esqueci a senha
              </Typography>
            </div>
            <Button fullWidth variant='contained' type='submit' disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <Typography variant='body2' color='text.secondary' className='text-center'>
              Acesso restrito à equipe do Grupo L4. Problemas para entrar? Fale com o TI.
            </Typography>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
