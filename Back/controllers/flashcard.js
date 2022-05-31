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
            owner
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
            flashCard = await UserFlashCard.findOne({ studyQuery })
                .sort({ updatedAt: 1, timesAnsweredRigh: 1 })
                .populate({ path: "flashCard", model: "FlashCard" })
                .lean();
        } catch(e) { throw new Error(e.message); }

        if (!flashCard) { throw new Error("Tag não encontrada!"); }

        let count;
        try { count = await UserFlashCard.countDocuments({ studyQuery });
        } catch(e) { throw new Error(e.message); }

        return {
            totalSlashcards: count,
            flashCard
        };
    }
}