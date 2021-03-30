const path = require('path')
const env = require('dotenv')
const config = env.config({ path: path.resolve(__dirname, './../env/producao.env') })
const https = require('https')
const axios = require('axios')
const fs = require('fs')

const getTokenAuth = async () => {
    const dirCertificate = `./../certs/${process.env.GN_CERTIFICATE_NAME}`
    const certificate = fs.readFileSync(path.resolve(__dirname, `${dirCertificate}`))
    const credentials = {
        client_id: process.env.GN_CLIENT_ID,
        client_secret: process.env.GN_SECRET_ID
    }
    const data = JSON.stringify({ grant_type: "client_credentials" })
    const dataCredentials = `${credentials.client_id}:${credentials.client_secret}`
    const auth = Buffer.from(dataCredentials).toString('base64')
    const agent = new https.Agent({
        pfx: certificate,
        passphrase: ''
    })

    const config = {
        method: 'POST',
        url: `${process.env.GN_BASE_URL}/oauth/token`,
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-type': 'application/json'
        },
        httpsAgent: agent,
        data: data
    }

    const { data: token } = await axios(config)
    return token
}

const createBilling = async (datatoken, databilling) => {
    const dirCertificate = `./../certs/${process.env.GN_CERTIFICATE_NAME}`
    const certificate = fs.readFileSync(path.resolve(__dirname, `${dirCertificate}`))
    const agent = new https.Agent({ pfx: certificate, passphrase: '' })
    const data = JSON.stringify(databilling);
    const config = {
        method: 'POST',
        url: `${process.env.GN_BASE_URL}/v2/cob`,
        headers: {
            Authorization: `${datatoken.token_type} ${datatoken.access_token}`,
            'Content-type': 'application/json'
        },
        httpsAgent: agent,
        data: data
    }

    const { data: billing } = await axios(config)

    return billing
}

const getQRcodeByLocID = async (datatoken, locId) => {
    const dirCertificate = `./../certs/${process.env.GN_CERTIFICATE_NAME}`
    const certificate = fs.readFileSync(path.resolve(__dirname, `${dirCertificate}`))
    const agent = new https.Agent({ pfx: certificate, passphrase: '' })
    const config = {
        method: 'GET',
        url: `${process.env.GN_BASE_URL}/v2/loc/${locId}/qrcode`,
        headers: {
            Authorization: `${datatoken.token_type} ${datatoken.access_token}`,
            'Content-type': 'application/json'
        },
        httpsAgent: agent
    }

    const result = await axios(config)

    return result.data
}

const runStepsPix = async () => {
    try {
        const { token_type, access_token } = await getTokenAuth()
        const token = { token_type, access_token };
        const databilling = {
            calendario: {
                expiracao: 3600
            },
            devedor: {
                cpf: '57965333040',
                nome: 'Cleyton Gama'
            },
            valor: {
                original: '0.01'
            },
            chave: 'bf0817a6-3cf2-4edc-88b3-0d058bbdf0f5',
            solicitacaoPagador: 'Transação via pix api gerencianet'
        }
        const { loc: { id } } = await createBilling(token, databilling)

        const dataQRcode = await getQRcodeByLocID(token, id)

        console.log(dataQRcode.imagemQrcode)
    } catch (e) {
        console.log(e)
    }
}

runStepsPix()


