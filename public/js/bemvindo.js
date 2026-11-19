const usuario = exigirLogin()

if (usuario) {
    montarBarra('bemvindo.html')
    document.getElementById('saudacao').textContent = `Olá, ${usuario.nome}. Sua música, sua conta.`
    const campos = {
        Nome: `${usuario.nome} ${usuario.sobrenome}`,
        Email: usuario.email,
        CPF: usuario.cpf,
        Telefone: Mascara.telefone(usuario.telefone),
        Endereço: `${usuario.rua}, ${usuario.cidade} - ${usuario.estado}`
    }
    document.getElementById('dados').innerHTML = Object.entries(campos)
        .map(([chave, valor]) => `<div><span>${chave}</span><strong>${esc(valor)}</strong></div>`)
        .join('')
}
