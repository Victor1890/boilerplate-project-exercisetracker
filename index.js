const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose');

const url = `mongodb+srv://root:${process.env.MONGO_PASS}@cluster0.3sdzszi.mongodb.net/?retryWrites=true&w=majority`

mongoose.connect(url).catch(error => console.log({ error }));

app.use(cors({
  origin: (domain, next) => {
    return next(null, true)
  },
  optionsSuccessStatus: true
}));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new mongoose.Schema({
  username: String
});

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);




app.post("/api/users", (req, res) => {

  const { username } = req.body;
  const user = new User({ username })

  user.save();

  return res.json(user);
})


app.get("/api/users", async (req, res) => {

  const users = await User.find().exec();
  return res.json(users);

});

app.post("/api/users/:_id/exercises", (req, res) => {

  const { _id } = req.params;
  const { description, duration, date } = req.body;

  const user = User.findById(_id).exec();

  if (!user) return res.status(404).json({ error: { message: "User not found" } });

  const exercise = new Exercise({
    username: user.username,
    description,
    duration,
    date: date ? new Date(date) : new Date(),
  })

  exercise.save();

  return res.json({
    _id,
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
  });

});

app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  let { from, to, limit } = req.query;

  if (from) {
    from = new Date(from);
    if (!from || from == "Invalid Date") return res.json("Invalid Date Entered");
  }
  if (to) {
    to = new Date(to);
    if (!to || to == "Invalid Date") return res.json("Invalid Date Entered");
  }
  if (limit) {
    limit = new Date(limit);
    if (!limit || limit == "Invalid Date") return res.json("Invalid Date Entered");
  }

  const user = await User.findById(_id).exec();
  if (!user) return res.status(404).json({ error: { message: "User not found" } });

  const result = {};
  const dateFilter = {};

  if (from) {
    result["from"] = from.toDateString();
    dateFilter["$gte"] = from;
    if (to) {
      result["to"] = to.toDateString();
      dateFilter["$lt"] = to;
    } else {
      dateFilter["$lt"] = Date.now();
    }
  }

  if (to) {
    result["to"] = to.toDateString();
    dateFilter["$lt"] = to;
    dateFilter["$gte"] = new Date("1960-01-01");
  }

  if (to || from) {
    filter.date = dateFilter;
  }

  const exercises = limit ? await Exercise.find({ username: user.username }).exec() : await Exercise.find(filter).exec();

  const log = exercises.map(item => ({ duration: item.duration, date: item.date.toDateString(), description: item.toDateString }))

  return res.json({
    ...result,
    _id,
    username: user.username,
    count: exercises.length,
    log
  });
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
