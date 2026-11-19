const API = location.port === '3000' ? '' : 'http://localhost:3000'

const ESTADOS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

const LOGO = `<svg class="logo" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#1ed760"/><path d="M10 17c9-3 19-2 28 3M11.5 25c8-2.5 16-1.5 24 2.5M13 32.5c7-2 13-1 19 2" fill="none" stroke="#000" stroke-width="3.5" stroke-linecap="round"/></svg>`

const Sessao = {
    obter() {
        try {
            return JSON.parse(sessionStorage.getItem('usuario'))
        } catch {
            return null
        }
    },
    salvar(usuario) {
        const { senha, ...resto } = usuario
        sessionStorage.setItem('usuario', JSON.stringify(resto))
    },
    limpar() {
        sessionStorage.removeItem('usuario')
    }
}

const Mascara = {
    cpf(valor) {
        const d = valor.replace(/\D/g, '').slice(0, 11)
        return d
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    },
    cep(valor) {
        const d = valor.replace(/\D/g, '').slice(0, 8)
        return d.replace(/(\d{5})(\d{1,3})$/, '$1-$2')
    },
    telefone(valor) {
        const d = String(valor || '').replace(/\D/g, '').slice(0, 11)
        const ddd = d.replace(/(\d{2})(\d)/, '($1) $2')
        if (d.length <= 10) return ddd.replace(/(\d{4})(\d{1,4})$/, '$1-$2')
        return ddd.replace(/(\d{5})(\d{1,4})$/, '$1-$2')
    }
}

function esc(texto) {
    const mapa = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return String(texto ?? '').replace(/[&<>"']/g, c => mapa[c])
}

async function requisicao(caminho, opcoes = {}) {
    const resposta = await fetch(API + caminho, {
        headers: { 'Content-Type': 'application/json' },
        ...opcoes
    })
    if (!resposta.ok) throw new Error(resposta.status)
    return resposta.json()
}

async function existe(campo, valor, ignorarId = null) {
    const lista = await requisicao(`/pessoas?${campo}=${encodeURIComponent(valor)}`)
    return lista.some(p => p.id !== ignorarId)
}

let temporizadorAviso

function aviso(texto, erro = false) {
    let el = document.getElementById('aviso')
    if (!el) {
        el = document.createElement('div')
        el.id = 'aviso'
        el.className = 'aviso'
        el.setAttribute('role', 'status')
        document.body.appendChild(el)
    }
    el.textContent = texto
    el.classList.toggle('erro-aviso', erro)
    el.classList.add('visivel')
    clearTimeout(temporizadorAviso)
    temporizadorAviso = setTimeout(() => el.classList.remove('visivel'), 3000)
}

function montarTopo() {
    document.getElementById('topo').innerHTML = LOGO
}

function montarBarra(paginaAtiva) {
    const usuario = Sessao.obter()
    const links = [['bemvindo.html', 'Início']]
    if (usuario && usuario.perfil === 'admin') links.push(['admin.html', 'Usuários'])
    const itens = links
        .map(([href, texto]) => `<a href="${href}" class="${href === paginaAtiva ? 'ativo' : ''}">${texto}</a>`)
        .join('')
    document.getElementById('barra').innerHTML = `<a href="bemvindo.html" aria-label="Início">${LOGO}</a><nav>${itens}<button class="btn sec pequeno" id="sair" type="button">Sair</button></nav>`
    document.getElementById('sair').addEventListener('click', () => {
        Sessao.limpar()
        location.href = 'index.html'
    })
}

function exigirLogin(somenteAdmin = false) {
    const usuario = Sessao.obter()
    if (!usuario || (somenteAdmin && usuario.perfil !== 'admin')) {
        location.href = 'index.html'
        return null
    }
    return usuario
}

function preencherEstados(select) {
    select.innerHTML = '<option value="">Selecione</option>' + ESTADOS.map(uf => `<option value="${uf}">${uf}</option>`).join('')
}

function aplicarMascaras(form) {
    form.cpf.addEventListener('input', () => form.cpf.value = Mascara.cpf(form.cpf.value))
    form.cep.addEventListener('input', () => form.cep.value = Mascara.cep(form.cep.value))
    form.telefone.addEventListener('input', () => form.telefone.value = Mascara.telefone(form.telefone.value))
}

function coletarDados(form) {
    const dados = {}
    for (const el of form.elements) {
        if (el.name) dados[el.name] = el.value.trim()
    }
    dados.email = (dados.email || '').toLowerCase()
    return dados
}

function validarPessoa(dados, senhaObrigatoria = true) {
    const obrigatorios = ['nome', 'sobrenome', 'cpf', 'email', 'rua', 'cep', 'cidade', 'estado', 'telefone']
    if (senhaObrigatoria) obrigatorios.push('senha')
    const vazios = obrigatorios.filter(campo => !dados[campo])
    if (vazios.length) return { mensagem: 'Preencha todos os campos.', campos: vazios }
    if (dados.cpf.length !== 14) return { mensagem: 'Informe o CPF completo.', campos: ['cpf'] }
    if (!/^\S+@\S+\.\S+$/.test(dados.email)) return { mensagem: 'Informe um email válido.', campos: ['email'] }
    if (dados.cep.length !== 9) return { mensagem: 'Informe o CEP completo.', campos: ['cep'] }
    if (dados.telefone.replace(/\D/g, '').length < 10) return { mensagem: 'Informe o telefone com DDD.', campos: ['telefone'] }
    if (dados.senha && dados.senha.length < 4) return { mensagem: 'A senha deve ter ao menos 4 caracteres.', campos: ['senha'] }
    return null
}

function marcarInvalidos(form, campos) {
    campos.forEach(nome => form.elements[nome].classList.add('invalido'))
}

function limparInvalidos(form) {
    for (const el of form.elements) el.classList.remove('invalido')
}
