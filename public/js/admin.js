const atual = exigirLogin(true)

if (atual) {
    const corpo = document.getElementById('corpo')
    const busca = document.getElementById('busca')
    const contagem = document.getElementById('contagem')
    const fundo = document.getElementById('fundo-modal')
    const formEdicao = document.getElementById('form-edicao')
    const erroEdicao = document.getElementById('erro-edicao')
    let usuarios = []
    let editandoId = null
    let atraso

    montarBarra('admin.html')
    preencherEstados(formEdicao.estado)
    aplicarMascaras(formEdicao)

    function linhaVazia(texto) {
        corpo.innerHTML = `<tr><td colspan="7" class="vazio">${texto}</td></tr>`
    }

    function renderizar() {
        contagem.textContent = usuarios.length === 1 ? '1 usuário' : `${usuarios.length} usuários`
        if (!usuarios.length) {
            linhaVazia('Nenhum usuário encontrado.')
            return
        }
        corpo.innerHTML = usuarios.map(p => `
            <tr>
                <td>${esc(p.nome)} ${esc(p.sobrenome)}</td>
                <td>${esc(p.cpf)}</td>
                <td>${esc(p.email)}</td>
                <td>${esc(Mascara.telefone(p.telefone))}</td>
                <td>${esc(p.cidade)} - ${esc(p.estado)}</td>
                <td><span class="selo ${p.perfil === 'admin' ? 'admin' : ''}">${p.perfil === 'admin' ? 'Admin' : 'Usuário'}</span></td>
                <td><div class="acoes">
                    <button type="button" class="btn sec pequeno" data-editar="${p.id}">Editar</button>
                    <button type="button" class="btn perigo pequeno" data-apagar="${p.id}">Apagar</button>
                </div></td>
            </tr>`).join('')
    }

    async function carregar() {
        const termo = busca.value.trim()
        const caminho = termo ? `/pessoas?cpf_like=${encodeURIComponent(termo)}` : '/pessoas'
        try {
            usuarios = await requisicao(caminho)
            renderizar()
        } catch {
            contagem.textContent = ''
            linhaVazia('Não foi possível conectar ao servidor.')
        }
    }

    function abrirEdicao(id) {
        const pessoa = usuarios.find(u => u.id === id)
        if (!pessoa) return
        editandoId = id
        erroEdicao.textContent = ''
        limparInvalidos(formEdicao)
        for (const el of formEdicao.elements) {
            if (!el.name) continue
            if (el.name === 'senha') el.value = ''
            else if (el.name === 'telefone') el.value = Mascara.telefone(pessoa.telefone)
            else el.value = pessoa[el.name] ?? ''
        }
        formEdicao.perfil.disabled = id === atual.id
        fundo.classList.add('aberto')
        formEdicao.nome.focus()
    }

    function fecharModal() {
        fundo.classList.remove('aberto')
        editandoId = null
    }

    function falharEdicao(mensagem, campos) {
        erroEdicao.textContent = mensagem
        marcarInvalidos(formEdicao, campos)
    }

    async function apagar(id) {
        if (id === atual.id) {
            aviso('Você não pode apagar a própria conta.', true)
            return
        }
        const pessoa = usuarios.find(u => u.id === id)
        if (!pessoa || !confirm(`Apagar ${pessoa.nome} ${pessoa.sobrenome}?`)) return
        try {
            await requisicao(`/pessoas/${id}`, { method: 'DELETE' })
            aviso('Usuário apagado.')
            await carregar()
        } catch {
            aviso('Não foi possível apagar o usuário.', true)
        }
    }

    busca.addEventListener('input', () => {
        busca.value = Mascara.cpf(busca.value)
        clearTimeout(atraso)
        atraso = setTimeout(carregar, 250)
    })

    corpo.addEventListener('click', e => {
        const editar = e.target.closest('[data-editar]')
        const excluir = e.target.closest('[data-apagar]')
        if (editar) abrirEdicao(Number(editar.dataset.editar))
        if (excluir) apagar(Number(excluir.dataset.apagar))
    })

    formEdicao.addEventListener('submit', async e => {
        e.preventDefault()
        erroEdicao.textContent = ''
        limparInvalidos(formEdicao)
        const dados = coletarDados(formEdicao)
        const falha = validarPessoa(dados, false)
        if (falha) return falharEdicao(falha.mensagem, falha.campos)
        try {
            if (await existe('cpf', dados.cpf, editandoId)) return falharEdicao('Este CPF já está cadastrado.', ['cpf'])
            if (await existe('email', dados.email, editandoId)) return falharEdicao('Este email já está cadastrado.', ['email'])
            dados.telefone = dados.telefone.replace(/\D/g, '')
            if (!dados.senha) delete dados.senha
            const atualizado = await requisicao(`/pessoas/${editandoId}`, { method: 'PATCH', body: JSON.stringify(dados) })
            if (atualizado.id === atual.id) Sessao.salvar(atualizado)
            fecharModal()
            aviso('Usuário atualizado.')
            await carregar()
        } catch {
            erroEdicao.textContent = 'Não foi possível salvar. Verifique o servidor.'
        }
    })

    document.getElementById('cancelar').addEventListener('click', fecharModal)
    fundo.addEventListener('click', e => {
        if (e.target === fundo) fecharModal()
    })
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') fecharModal()
    })

    carregar()
}
