/**
 * Utilitário para geração de VCard (contato digital)
 * @param {Object} profile - Objeto contendo os dados do perfil do Supabase
 */
function downloadVCard(profile) {
    const name = profile.name || 'Contato Tagscard';
    const phone = profile.social_links?.whatsapp || '';
    const email = profile.email || ''; // E-mail pode vir da sessão se necessário
    const bio = profile.bio || '';
    const website = window.location.href;
    
    // Limpar o número do whatsapp (remover caracteres não numéricos)
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? `+${cleanPhone}` : `+55${cleanPhone}`;

    let vcard = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${name}`,
        `N:;${name};;;`,
        `TEL;TYPE=CELL:${formattedPhone}`,
        `URL:${website}`,
        `NOTE:${bio.replace(/\n/g, ' ')}`,
        "END:VCARD"
    ].join("\n");

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${name.replace(/\s+/g, '_')}.vcf`);
    document.body.appendChild(link);
    link.click();
    
    // Limpeza
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 100);
}

window.downloadVCard = downloadVCard;
