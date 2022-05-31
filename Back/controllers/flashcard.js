let { FlashCard, UserFlashCard, ObjectId, User, Tag } = require("../models");

module.exports = {
    createNewFlashCard: async (newFlashCardData) => {
        if (!newFlashCardData.owner) { throw new Error("Insira o dono do flash card!"); }
        if (!newFlashCardData.question) { throw new Error("Insira uma pergunta!"); }
        if (!Array.isArray(newFlashCardData.answers) || newFlashCardData.answers.length != 5) { throw new Error("Insira 5 respostas!"); }
        if (!newFlashCardData.answers.some(ans => ans.isRightAnswer)) { throw new Error("Indique a resposta correta!"); }
        if (newFlashCardData.answers.filter(ans => ans.isRightAnswer).length > 1) { throw new Error("Indique apenas uma resposta correta!"); }
        if (newFlashCardData.answers.some(ans => ans.text == undefined)) { throw new Error("Preencha todas as respostas!"); }

        let owner;
        try { owner = await User.findOne({ _id: newFlashCardData.owner }).select("_id").lean();
        } catch(e) { throw new Error(e.message); }

        if (!owner) { throw new Error("Dono não encontrado!"); }

        let tagId;
        if (newFlashCardData.tag) {
            try { tag = await Tag.findOne({ _id: newFlashCardData.tag }).select("_id").lean();
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
        try { owner = await User.findOne({ _id: newTagData.owner }).select("_id").lean();
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
        try { owner = await User.findOne({ _id: studyQuery.owner }).select("_id").lean();
        } catch(e) { throw new Error(e.message); }

        if (!owner) { throw new Error("Dono não encontrado!"); }

        let query = {
            owner,
            deleted: false
        }

        if (studyQuery.tags) {
            let tags;
            try { tags = await Tag.find({ _id: { $in: studyQuery.tags }}).select("_id").lean();
            } catch(e) { throw new Error(e.message); }

            if (tags.length != studyQuery.tags.length) { throw new Error("Nâo foi possível encontrar todas as tags!"); }

            query.tags = tags.map(tag => tag._id);
        }


        let flashCard;
        try { 
            flashCard = await UserFlashCard.findOne(query)
                .sort({ updatedAt: 1, timesAnsweredRigh: 1 })
                .populate({ path: "flashCard", model: "FlashCard" })
                .lean();
        } catch(e) { throw new Error(e.message); }

        if (!flashCard) { throw new Error("FlashCard não encontrado!"); }

        let count;
        try { count = await UserFlashCard.countDocuments({ studyQuery });
        } catch(e) { throw new Error(e.message); }

        return {
            totalSlashcards: count,
            flashCard
        };
    },

    deleteFlashCard: async (flashCardId, requesterId) => {
        if (!requesterId) { throw new Error("Insira o usuário!"); }
        if (!flashCardId) { throw new Error("Insira o flashcard!"); }

        let flashCardToDelete;
        try { flashCardToDelete = await FlashCard.findOne({ _id: flashCardId });
        } catch(e) { throw new Error(e.message); }

        if (!flashCardToDelete) { throw new Error("FlashCard não encontrado"); }

        let requester;
        try { requester = await User.findOne({ _id: requesterId });
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
        try { flashCardToUpdate = await FlashCard.findOne({ _id: updatedFlashCardData.flashCard });
        } catch(e) { throw new Error(e.message); }

        if (!flashCardToUpdate) { throw new Error("FlashCard não encontrado"); }

        let requester;
        try { requester = await User.findOne({ _id: updatedFlashCardData.requester });
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
            try { tag = await Tag.findOne({ _id: updatedFlashCardData.tag }).select("_id").lean();
            } catch(e) { throw new Error(e.message); }

            if (!tag) { throw new Error("Tag não encontrada!"); }

            flashCardRelation.tag = tag._id;

            try { await flashCardRelation.save()
            } catch(e) { throw new Error(e.message); }
        }
    },
}