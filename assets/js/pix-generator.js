/**
 * Tagscard PIX Payload Generator
 * Gera o BRCode (Copia e Cola) legítimo seguindo o padrão EMV/Banco Central.
 */

window.PixGenerator = {
    // CRC16 CCITT (Padrão PIX)
    crc16: function(str) {
        let crc = 0xFFFF;
        for (let i = 0; i < str.length; i++) {
            let charCode = str.charCodeAt(i);
            crc ^= (charCode << 8);
            for (let j = 0; j < 8; j++) {
                if (crc & 0x8000) {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc = (crc << 1);
                }
            }
        }
        return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    },

    // Formatar campo (ID + Tamanho + Valor)
    formatField: function(id, value) {
        const size = value.length.toString().padStart(2, '0');
        return `${id}${size}${value}`;
    },

    /**
     * @param {string} key - Chave PIX
     * @param {string} name - Nome do recebedor (max 25 chars)
     * @param {string} city - Cidade do recebedor (max 15 chars)
     * @param {string} amount - Valor (opcional)
     */
    generatePayload: function(key, name = 'TAGSCARD USER', city = 'SAO PAULO', amount = '') {
        // 1. Merchant Account Information
        const gui = this.formatField('00', 'BR.GOV.BCB.PIX');
        const keyField = this.formatField('01', key);
        const merchantAccount = this.formatField('26', gui + keyField);

        // 2. Payload Inicial
        let payload = '000201'; // Payload Format Indicator
        payload += merchantAccount;
        payload += this.formatField('52', '0000'); // Merchant Category Code
        payload += this.formatField('53', '986');  // Transaction Currency (BRL)
        
        if (amount) {
            payload += this.formatField('54', amount);
        }

        payload += this.formatField('58', 'BR'); // Country Code
        payload += this.formatField('59', name.substring(0, 25).toUpperCase()); // Merchant Name
        payload += this.formatField('60', city.substring(0, 15).toUpperCase()); // Merchant City
        payload += this.formatField('62', this.formatField('05', '***')); // Additional Data Field (TXID)

        // 3. Adicionar CRC16
        payload += '6304';
        payload += this.crc16(payload);

        return payload;
    }
};
