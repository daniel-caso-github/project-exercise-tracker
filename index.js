const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto');
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listUsers = [];
const listExercices = [];
const listLog = []

function generateId() {
  const bytes = crypto.randomBytes(12);
  const id = bytes.toString('hex');
  return id;
}

function convertirFormato(fechaString) {
  const fecha = new Date(fechaString);

  const meses = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const diasSemana = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const diaSemana = diasSemana[fecha.getDay()];
  const mes = meses[fecha.getMonth()];
  const dia = fecha.getDate();
  const año = fecha.getFullYear();

  // Formatear la fecha en el formato deseado
  const fechaFormateada = `${diaSemana} ${mes} ${dia.toString().padStart(2, '0')} ${año}`;

  return fechaFormateada;
}

//Users
function createUser(username) {
  const _id = generateId();
  user = { _id: _id, username: username }
  listUsers.push(user);
  return user;
}

function searchUserbyUserName(username) {
  return listUsers.find(item => item.username === username)
}

// Exercises
function createExercise(description, duration, date, _id) {
  exercise = {
     _id: _id, 
     description: description, 
     duration: parseInt(duration), 
     date: date 
  }
  listExercices.push(exercise);
  return exercise;
}

function searchUserbyId(_id) {
  return listUsers.find(item => item._id === _id)
}

function searchExerciceByUserId(_id) {
  return listExercices.filter(item => item._id === _id).map(({ _id, ...rest}) => rest)
}

app.post('/api/users', function(req, res) {
  const username = req.body.username;
  user = searchUserbyUserName(username)
  if (!user){
    user = createUser(username);
  }
  result = {
    username: username,
    _id: user._id
  }
  res.json(result);
});

app.get('/api/users', function(req, res) {
  res.json(listUsers);
});

app.post('/api/users/:_id/exercises', function(req, res) {
  const _id = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const vaidDate = req.body.date;

  if (!vaidDate) {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    let month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    let day = currentDate.getDate().toString().padStart(2, '0');
    date = `${year}-${month}-${day}`;
  }else{
    date = vaidDate
  }

  exercise = createExercise(description, duration, date, _id);
  user = searchUserbyId(_id)
  result = {
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date:  convertirFormato(exercise.date),
    _id: user._id,
  };
  res.json(result);
});

app.get('/api/users/:_id/logs', function(req, res) {
  const _id = req.params._id;
  const { from, to, limit} = req.query;

  let filteredExercises = searchExerciceByUserId(_id);


  if (from || to) {
    filteredExercises = filteredExercises.filter(item => {
      const exerciseDate = new Date(item.date);
      if (from && to) {
        return exerciseDate >= new Date(from) && exerciseDate <= new Date(to);
      } else if (from) {
        return exerciseDate >= new Date(from);
      } else if (to) {
        return exerciseDate <= new Date(to);
      }
    });
  }

  if (limit) {
    filteredExercises = filteredExercises.slice(0, Number(limit));
  }

  const user = searchUserbyId(_id);

  filteredExercises.forEach(item => { item.date = convertirFormato(item.date)})

  console.log(filteredExercises)
  const result = {
    username: user.username,
    count: parseInt(filteredExercises.length),
    _id: user._id,
    logs: filteredExercises
  };

  res.json(result);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
