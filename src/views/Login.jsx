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
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

// Third-party Imports
import { signIn } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, minLength, string, email, pipe, nonEmpty } from 'valibot'
import classnames from 'classnames'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const schema = object({
  email: pipe(string(), minLength(1, 'Informe seu email'), email('Email inválido')),
  password: pipe(string(), nonEmpty('Informe sua senha'), minLength(4, 'Mínimo de 4 caracteres'))
})

const Login = () => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [errorState, setErrorState] = useState(null)
  const [loading, setLoading] = useState(false)

  // Hooks
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
        setErrorState({ message: ['Não foi possível entrar. Tente novamente.'] })
      }
    }
  }

  return (
    <div className='flex bs-full justify-center'>
      {/* Branded showcase panel */}
      <div
        className='flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-10 max-md:hidden overflow-hidden'
        style={{
          backgroundColor: '#0B3DA0',
          backgroundImage: 'url(/images/fundo-l4x.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className='relative z-[1] flex flex-col gap-6 max-is-[460px]'>
          <Typography
            variant='h1'
            sx={{ color: '#fff', fontWeight: 800, letterSpacing: 2, lineHeight: 1 }}
          >
            L4&nbsp;ATIVOS
          </Typography>
          <Typography variant='h5' sx={{ color: 'rgba(255,255,255,0.92)', fontWeight: 500, lineHeight: 1.4 }}>
            Antecipe seu crédito judicial com segurança.
          </Typography>
          <Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Plataforma interna de gestão de leads, pipeline de precatórios, RPVs e monitoramento processual.
          </Typography>
          <div className='flex gap-8 mt-4'>
            <div>
              <Typography variant='h4' sx={{ color: '#fff', fontWeight: 800 }}>+R$3 bi</Typography>
              <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.7)' }}>em ativos geridos</Typography>
            </div>
            <div>
              <Typography variant='h4' sx={{ color: '#fff', fontWeight: 800 }}>+11 mil</Typography>
              <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.7)' }}>casos antecipados</Typography>
            </div>
          </div>
        </div>
        <div className='absolute inset-0' style={{ background: 'linear-gradient(120deg, rgba(6,28,78,0.55), rgba(11,61,160,0.15))' }} />
      </div>

      {/* Login form */}
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset]'>
          <div className='flex flex-col items-center gap-4 text-center'>
            <img src='/images/logo-l4.png' alt='L4 Ativos' style={{ height: 46, width: 'auto' }} />
            <div>
              <Typography variant='h4' fontWeight={700} sx={{ color: 'primary.main', letterSpacing: 0.3 }}>
                Bem-vindo de volta
              </Typography>
              <Typography variant='body2' color='text.secondary' mt={0.5}>
                Acesse o CRM com seu email corporativo
              </Typography>
            </div>
          </div>

          {errorState?.message?.[0] && (
            <Alert severity='error' onClose={() => setErrorState(null)}>
              {errorState.message[0]}
            </Alert>
          )}

          <form
            noValidate
            autoComplete='off'
            onSubmit={handleSubmit(onSubmit)}
            className='flex flex-col gap-5'
          >
            <Controller
              name='email'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  autoFocus
                  type='email'
                  label='Email'
                  placeholder='nome@l4ativos.com.br'
                  onChange={e => {
                    field.onChange(e.target.value)
                    errorState !== null && setErrorState(null)
                  }}
                  {...(errors.email && { error: true, helperText: errors.email.message })}
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
              <FormControlLabel control={<Checkbox defaultChecked />} label='Lembrar-me' />
              <Typography
                className='text-end'
                color='primary.main'
                component={Link}
                href={getLocalizedUrl('/forgot-password', locale)}
              >
                Esqueci minha senha
              </Typography>
            </div>
            <Button
              fullWidth
              variant='contained'
              type='submit'
              size='large'
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color='inherit' /> : null}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <Typography variant='body2' color='text.secondary' className='text-center'>
              Acesso restrito à equipe L4 Ativos
            </Typography>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
