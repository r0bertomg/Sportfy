const form = document.getElementById('form')
const erro = document.getElementById('erro')
const botao = document.getElementById('entrar')
const olho = document.getElementById('olho')

montarTopo()

form.cpf.addEventListener('input', () => form.cpf.value = Mascara.cpf(form.cpf.value))

olho.addEventListener('click', () => {
    const mostrar = form.senha.type === 'password'
    form.senha.type = mostrar ? 'text' : 'password'
    olho.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha')
})

form.addEventListener('submit', async e => {
    e.preventDefault()
    erro.textContent = ''
    limparInvalidos(form)
    const cpf = form.cpf.value.trim()
    const senha = form.senha.value
    if (cpf.length !== 14 || !senha) {
        erro.textContent = 'Informe seu CPF e sua senha.'
        if (cpf.length !== 14) form.cpf.classList.add('invalido')
        if (!senha) form.senha.classList.add('invalido')
        return
    }
    botao.disabled = true
    try {
        const lista = await requisicao(`/pessoas?cpf=${encodeURIComponent(cpf)}&senha=${encodeURIComponent(senha)}`)
        if (!lista.length) {
            erro.textContent = 'CPF ou senha incorretos.'
            form.cpf.classList.add('invalido')
            form.senha.classList.add('invalido')
            botao.disabled = false
            return
        }
        Sessao.salvar(lista[0])
        location.href = 'bemvindo.html'
    } catch {
        erro.textContent = 'Não foi possível conectar ao servidor.'
        botao.disabled = false
    }
})
