const form = document.getElementById('form')
const erro = document.getElementById('erro')
const botao = document.getElementById('cadastrar')

montarTopo()
preencherEstados(form.estado)
aplicarMascaras(form)

function sortear(n) {
    return Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('')
}

document.getElementById('exemplo').addEventListener('click', () => {
    const id = sortear(4)
    form.nome.value = 'Usuario'
    form.sobrenome.value = `Teste ${id}`
    form.cpf.value = Mascara.cpf(sortear(11))
    form.telefone.value = Mascara.telefone('11' + '9' + sortear(8))
    form.email.value = `teste${id}@exemplo.com`
    form.senha.value = '1234'
    form.rua.value = 'Rua Exemplo, 123'
    form.cep.value = Mascara.cep(sortear(8))
    form.cidade.value = 'Cidade Exemplo'
    form.estado.value = 'SP'
    limparInvalidos(form)
    erro.textContent = ''
})

function falhar(mensagem, campos) {
    erro.textContent = mensagem
    marcarInvalidos(form, campos)
    botao.disabled = false
}

form.addEventListener('submit', async e => {
    e.preventDefault()
    erro.textContent = ''
    limparInvalidos(form)
    const dados = coletarDados(form)
    const falha = validarPessoa(dados)
    if (falha) {
        falhar(falha.mensagem, falha.campos)
        return
    }
    botao.disabled = true
    try {
        if (await existe('cpf', dados.cpf)) return falhar('Este CPF já está cadastrado.', ['cpf'])
        if (await existe('email', dados.email)) return falhar('Este email já está cadastrado.', ['email'])
        dados.telefone = dados.telefone.replace(/\D/g, '')
        dados.perfil = 'usuario'
        await requisicao('/pessoas', { method: 'POST', body: JSON.stringify(dados) })
        aviso('Conta criada com sucesso.')
        setTimeout(() => location.href = 'index.html', 1200)
    } catch {
        erro.textContent = 'Não foi possível conectar ao servidor.'
        botao.disabled = false
    }
})
