let { FlashCard, UserFlashCard, ObjectId, User, Tag, Friendship } = require("../models");

module.exports = {
    createNewFlashCard: async (newFlashCardData) => {
        if (!newFlashCardData.owner) { throw new Error("Insira o dono do flash card!"); }
        if (!newFlashCardData.question) { throw new Error("Insira uma pergunta!"); }
        if (!Array.isArray(newFlashCardData.answers) || newFlashCardData.answers.length != 5) { throw new Error("Insira 5 respostas!"); }
        if (!newFlashCardData.answers.some(ans => ans.isRightAnswer)) { throw new Error("Indique a resposta correta!"); }
        if (newFlashCardData.answers.filter(ans => ans.isRightAnswer).length > 1) { throw new Error("Indique apenas uma resposta correta!"); }
        if (newFlashCardData.answers.some(ans => ans.text == undefined)) { throw new Error("Preencha todas as respostas!"); }

        let owner;
        try { owner = await User.findOne({ _id: newFlashCardData.owner, deleted: false }).select("_id").lean();
        } catch(e) { throw new Error(e.message); }

        if (!owner) { throw new Error("Dono não encontrado!"); }

        let tagId;
        if (newFlashCardData.tag) {
            try { tag = await Tag.findOne({ _id: newFlashCardData.tag, deleted: false }).select("_id").lean();
            } catch(e) { throw new Error(e.message); }

            if (!tag) { throw new Error("Tag não encontrada!"); }

            tagId = tag._id;
        }

        let newFlashCard;
        try { newFlashCard = await FlashCard.create(newFlashCardData);
        } catch(e) { throw new Error(e.message); }

        let newFlashCardRelationData = {
            user: owner._id,
            flashCard: newFlashCard._id,
            tag: tagId
        }

        let newFlashCardRelation;
        try { newFlashCardRelation = await UserFlashCard.create(newFlashCardRelationData);
        } catch(e) { throw new Error(e.message); }

        return newFlashCard;
    },

    createNewTag: async (newTagData) => {
        if (!newTagData.owner) { throw new Error("Insira o dono da tag!"); }
        if (!newTagData.name) { throw new Error("Insira o nome da tag!"); }

        let owner;
        try { owner = await User.findOne({ _id: newTagData.owner, deleted: false }).select("_id").lean();
        } catch(e) { throw new Error(e.message); }

        if (!owner) { throw new Error("Dono não encontrado!"); }

        let newTag;
        try { newTag = await Tag.create(newTagData);
        } catch(e) { throw new Error(e.message); }

        return newTag;
    },

    getFlashCardToStudy: async (studyQuery) => {
        if (!studyQuery.owner) { throw new Error("Insira o dono do flash card!"); }

        let owner;
        try { owner = await User.findOne({ _id: studyQuery.owner, deleted: false }).select("_id").lean();
        } catch(e) { throw new Error(e.message); }

        if (!owner) { throw new Error("Dono não encontrado!"); }

        let query = {
            owner,
            deleted: false
        }

        if (studyQuery.tags) {
            let tags;
            try { tags = await Tag.find({ _id: { $in: studyQuery.tags }, deleted: false}).select("_id").lean();
            } catch(e) { throw new Error(e.message); }

            if (tags.length != studyQuery.tags.length) { throw new Error("Nâo foi possível encontrar todas as tags!"); }

            query.tags = tags.map(tag => tag._id);
        }


        let flashCard;
        try { 
            flashCard = await UserFlashCard.findOne(query)
                .sort({ updatedAt: 1, timesAnsweredRight: 1 })
                .populate({ path: "flashCard", model: "FlashCard" })
                .lean();
        } catch(e) { throw new Error(e.message); }

        if (!flashCard) { throw new Error("FlashCard não encontrado!"); }

        flashCard = { ...flashCard.flashCard, timesAnsweredRight: flashCard.timesAnsweredRight}

        let count;
        try { count = await UserFlashCard.countDocuments({ studyQuery });
        } catch(e) { throw new Error(e.message); }

        return {
            totalFlashcards: count,
            flashCard
        };
    },

    deleteFlashCard: async (flashCardId, requesterId) => {
        if (!requesterId) { throw new Error("Insira o usuário!"); }
        if (!flashCardId) { throw new Error("Insira o flashcard!"); }

        let flashCardToDelete;
        try { flashCardToDelete = await FlashCard.findOne({ _id: flashCardId, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (!flashCardToDelete) { throw new Error("FlashCard não encontrado"); }

        let requester;
        try { requester = await User.findOne({ _id: requesterId, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (!requester) { throw new Error("Usuário não encontrado"); }

        let updateQuery = {
            user: requester._id,
            flashCard: flashCardToDelete._id,
            deleted: false
        }

        try { await UserFlashCard.updateMany(updateQuery, { $set: { deleted: true }});
        } catch(e) { throw new Error(e.message); }

        let relationsWithThisFlashCard;        
        try { relationsWithThisFlashCard = await UserFlashCard.countDocuments({ flashCard: flashCardToDelete._id, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (relationsWithThisFlashCard == 0) {
            flashCardToDelete.deleted = true;

            try { await flashCardToDelete.save();
            } catch(e) { throw new Error(e.message); }
        }
    },

    editFlashCard: async (updatedFlashCardData) => {
        if (!updatedFlashCardData.requester) { throw new Error("Insira o usuário!"); }
        if (!updatedFlashCardData.flashCard) { throw new Error("Insira o flashcard!"); }

        let flashCardToUpdate;
        try { flashCardToUpdate = await FlashCard.findOne({ _id: updatedFlashCardData.flashCard, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (!flashCardToUpdate) { throw new Error("FlashCard não encontrado"); }

        let requester;
        try { requester = await User.findOne({ _id: updatedFlashCardData.requester, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (!requester) { throw new Error("Usuário não encontrado"); }

        if (String(flashCardToUpdate.owner) == String(requester._id)) { //flash card owner, can update question and answers
            if (updatedFlashCardData.question) { flashCardToUpdate.question = updatedFlashCardData.question; }

            if (updatedFlashCardData.answers) {
                if (!Array.isArray(updatedFlashCardData.answers) || updatedFlashCardData.answers.length != 5) { throw new Error("Insira 5 respostas!"); }
                if (!updatedFlashCardData.answers.some(ans => ans.isRightAnswer)) { throw new Error("Indique a resposta correta!"); }
                if (updatedFlashCardData.answers.filter(ans => ans.isRightAnswer).length > 1) { throw new Error("Indique apenas uma resposta correta!"); }
                if (updatedFlashCardData.answers.some(ans => ans.text == undefined)) { throw new Error("Preencha todas as respostas!"); }

                flashCardToUpdate.answers = updatedFlashCardData.answers;
            }
            
            try { await flashCardToUpdate.save()
            } catch(e) { throw new Error(e.message); }
        }

        if (updatedFlashCardData.tag) {
            let flashCardRelation;
            try { flashCardRelation = await UserFlashCard.findOne({ user: requester._id, flashCard: flashCardToUpdate._id, deleted: false });
            } catch(e) { throw new Error(e.message); }

            if (!flashCardRelation) { throw new Error("Usuário não possui esse flashcard!"); }

            let tag;
            try { tag = await Tag.findOne({ _id: updatedFlashCardData.tag, deleted: false }).select("_id").lean();
            } catch(e) { throw new Error(e.message); }

            if (!tag) { throw new Error("Tag não encontrada!"); }

            flashCardRelation.tag = tag._id;

            try { await flashCardRelation.save()
            } catch(e) { throw new Error(e.message); }
        }
    },

    deleteTag: async (tagId, requesterId) => {
        if (!requesterId) { throw new Error("Insira o usuário!"); }
        if (!tagId) { throw new Error("Insira a tag!"); }

        let tagToDelete;
        try { tagToDelete = await Tag.findOne({ _id: tagId, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (!tagToDelete) { throw new Error("Tag não encontrada"); }

        let requester;
        try { requester = await User.findOne({ _id: requesterId, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (!requester) { throw new Error("Usuário não encontrado"); }

        let updateQuery = {
            tag: tagToDelete._id,
            user: requester._id
        }

        try { await UserFlashCard.updateMany(updateQuery, { $set: { tag: undefined }});
        } catch(e) { throw new Error(e.message); }

        tagToDelete.deleted = true;

        try { await tagToDelete.save();
        } catch(e) { throw new Error(e.message); }
    },

    getUserTags: async (requesterId) => {
        if (!requesterId) { throw new Error("Insira o usuário!"); }

        let requester;
        try { requester = await User.findOne({ _id: requesterId, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (!requester) { throw new Error("Usuário não encontrado"); }

        let tags;
        try { tags = await Tag.find({ deleted: false, owner: requester._id });
        } catch(e) { throw new Error(e.message); }

        return tags;
    },

    getUserFlashCards: async (requesterId, skip, limit) => {
        if (!requesterId) { throw new Error("Insira o usuário"); }

        let requester;
        try { requester = await User.findOne({ _id: requesterId, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (!requester) { throw new Error("Usuário não encontrado"); }

        // skip = Number(skip);
        // skip = isNaN(skip) || skip < 0 ? 0 : skip;

        // limit = Number(limit);
        // limit = isNaN(limit) || limit < 0 ? 10 : limit;

        let flashCardsQuery = {
            user: requester._id,
            deleted: false
        }

        let flashCards;
        try { 
            flashCards = await UserFlashCard.find(flashCardsQuery)
                .populate({ 
                    path: "flashCard",
                    populate: [{
                        path: "owner",
                        select: "_id name username",
                        model: "User"
                    }],
                    model: "FlashCard" 
                })
                .populate({ path: "tag", model: "Tag" })
                // .skip(skip)
                // .limit(limit)
                .lean()
        } catch(e) { throw new Error(e.message); }

        flashCards = flashCards.map(card => card.flashCard)

        let totalFlashCards;
        try { totalFlashCards = await UserFlashCard.countDocuments(flashCardsQuery);
        } catch(e) { throw new Error(e.message); }

        return {
            totalFlashCards,
            flashCards
        }
    },

    answerFlashCard: async (answerObj) => {
        try { answerObj = JSON.parse(answerObj);
        } catch(e) {}

        if (!answerObj.user) { throw new Error("Insira o usuário!"); }
        if (!answerObj.userFlashCard) { throw new Error("Insira a relação do flashcard!"); }
        if (![true, false].includes(answerObj.answeredRight)) { throw new Error("Insira se o usuário acertou ou não!"); }

        let user;
        try { user = await User.findOne({ _id: answerObj.user, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (!user) { throw new Error("Usuário não encontrado"); }

        let flashCardRelation;
        try { flashCardRelation = await UserFlashCard.findOne({ _id: answerObj.userFlashCard, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (!flashCardRelation) { throw new Error("Usuário não possui esse flashcard!"); }

        flashCardRelation.timesAnsweredRight += answerObj.answeredRight ? 1 : -1;

        try { await flashCardRelation.save();
        } catch(e) { throw new Error(e.message); }
    },

    shareFlashCard: async (shareObj) => {
        if (!shareObj.requester) { throw new Error("Insira o usuário!"); }
        if (!shareObj.friend) { throw new Error("Insira o amigo!"); }
        if (!shareObj.flashCard) { throw new Error("Insira o flash card!"); }

        let requester;
        try { requester = await User.findOne({ _id: shareObj.requester, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (!requester) { throw new Error("Usuário não encontrado!"); }

        let flashCard;
        try { flashCard = await FlashCard.findOne({ _id: shareObj.flashCard, deleted: false })
        } catch(e) { throw new Error(e.message); }

        if (!flashCard) { throw new Error("FlashCard não encontrado!"); }

        if (String(flashCard.owner) != String(requester._id)) { throw new Error("Você não pode compartilhar esse flashcard, pois você não é dono dele!"); }

        let friend;
        try { friend = await User.findOne({ _id: shareObj.friend, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (!friend) { throw new Error("Amigo não encontrado!"); }

        let friendshipQuery = {
            $or: [
              {
                user: requester._id,
                friend: friend._id
              },
              {
                friend: requester._id,
                user: friend._id
              }
            ],
            deleted: false
        }

        let friendship;
        try { friendship = await Friendship.findOne(friendshipQuery);
        } catch(e) { throw new Error(e.message); }

        if (!friendship) { throw new Error("Você não é amigo desse usuário!"); }

        let newFlashCardRelationData = {
            user: friend._id,
            flashCard: flashCard._id
        }

        let newFlashCardRelation;
        try {newFlashCardRelation = await UserFlashCard.create(newFlashCardRelationData);
        } catch(e) { throw new Error(e.message); }

        return newFlashCardRelation;
    }
}