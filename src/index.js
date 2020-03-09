const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const mongoose = require('mongoose');
const config = require('./config');
const helper = require('./helper');

const keyboard = require('./keyboard');
const kb = require('./keyboard-buttons');

const database = require('../database.json');

helper.logStart();

//Database
mongoose.connect(config.DB_URL, {
    useMongoClient: true
})
    .then(() => console.log('Mongo db connected'))
    .catch((error) => console.log(error));


require('./model/poll.model');
require('./model/result.model');

const Poll = mongoose.model('poll');
const User = mongoose.model('user');

// database.poll.forEach(f => new Poll(f).save().catch(e => console.log(e)));


// =============================================

const bot = new TelegramBot(config.TOKEN, {
    polling: true
});

//keyboard

bot.on('message', msg => {
    console.log('Working', msg.from.first_name);
    const chatId = helper.getChatId(msg);

    switch (msg.text) {
        case kb.home.questionnaire :
            sendPollByQuery(chatId, {});
            break;
        case kb.home.result :
            sendStatistic(chatId, {});
            break;
    }
});


bot.onText(/\/start/, msg => {
    const text = `Добридень, ${msg.from.first_name}\nВиберіть команду для початку роботи `;
    bot.sendMessage(helper.getChatId(msg), text, {
        reply_markup: {
            //keyboard:
            keyboard: keyboard.home,
        }
    })
});

// bot.on('message', msg => {
//     const text = `Добридень, ${msg.from.first_name}\nВиберіть команду для початку роботи: `;
//     bot.sendMessage(helper.getChatId(msg), text, {
//         reply_markup: {
//             //keyboard:
//             keyboard: keyboard.home,
//         }
//     })
// });



bot.onText(/\/questionnaire/, msg => {
    sendPollByQuery(helper.getChatId(msg), {});
});
bot.onText(/\/result/, msg => {
    sendStatistic(helper.getChatId(msg), {});
});


bot.on('callback_query', function (query) {
    let tempId = query.message.chat.id;
    let tempVote = query.data;
    let tempName = query.name;

    var user1 = new User({
        user_id: `${query.message.chat.id}`,
        pollId: `${query.data}`,
        vote: `${query.data}`,
        name: `${query.from.first_name}`,
        surname: `${query.from.last_name}`
    });
    // user1.update(function (err, user) {
    //     if (err) return console.error(err);
    //     console.log(user.name + " saved to bookstore collection.");
    //     bot.answerCallbackQuery(query.id, 'Ваш ответ принят!');
    // });

    User.update({user_id: tempId}, user1, {upsert: true}, function (err) {
        if (err) {
            console.log("Error");
        }
        bot.answerCallbackQuery(query.id, 'Ви проголосували!');
    });

    User.find({}).then( users =>{
        users.map((item, i) =>{
            if (item.user_id === String(tempId) ) {
                 User.findOneAndUpdate({user_id: `${item.user_id}`}, {$set: {vote: `${tempVote}`}}, {new: true}, (err, doc) => {
                    if (err) {
                        console.log("Something wrong when updating data!");
                    }
                    console.log(doc);
                });
                bot.answerCallbackQuery(query.id, 'Ви змінили результат!');
            }

        });
    });


});

// ===============================

function sendStatistic(chatId, query) {
    User.find(query).then(users => {
        let voteArr = [];
        let agree = 0;
        let against = 0;
        let letabstained = 0;
        users.map((f, i) => {
            voteArr.push(f.vote);
        });

        voteArr.map((item, index, array) => {
            let test = item.slice(0,2);
            if (test === 'За'){
                agree++;
            }
            else if(test === 'Пр'){
                against++;
            }
            else if(test === 'Ут'){
                letabstained++;
            }

        });

        const html =`
          <strong>Результаты опросов</strong>
          <pre>За: ${agree}</pre>
          <pre>Против: ${against}</pre>
          <pre>Воздержались: ${letabstained}</pre>
        `;

        bot.sendMessage(chatId, html,{
            parse_mode: 'HTML'
        })

    });
}

function sendPollByQuery(chatId, query) {
    Poll.find(query).then(polls => {
        console.log(polls);
        polls.map((f, i) => {
            const caption = `
                 <strong>${f.headline}</strong>
                 <pre>${f.description}</pre>
                 `;
            fs.readFile(__dirname + `${f.image}`, (err, image) => {
                bot.sendPhoto(chatId, image, {
                    caption: caption,
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Переглянути відео',
                                    url: `${f.videoLink}`
                                }
                            ],
                            [
                                {
                                    text: 'За',
                                    callback_data: `За${f._id}`
                                },
                                {
                                    text: 'Проти',
                                    callback_data: `Проти${f._id}`
                                },
                                {
                                    text: 'Утриматися',
                                    callback_data: `Утриматися${f._id}`
                                },
                            ],
                            [
                                {
                                    text: 'Внести доповнення',
                                    url: `${f.interlocutorLink}`
                                }
                            ]
                        ],
                    }
                });
            });

        });
    });
}
