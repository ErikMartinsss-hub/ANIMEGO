import axios from 'axios';



// Coloque sua chave aqui para testarmos

const API_KEY = '8afc06276fa4cd6f89d291b3b8ddf9a8';



const tmdb = axios.create({

  baseURL: 'https://api.themoviedb.org/3',

  params: {

    api_key: API_KEY,

    language: 'pt-BR',

  },

});



export default tmdb;