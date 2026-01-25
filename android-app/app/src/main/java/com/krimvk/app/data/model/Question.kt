package com.krimvk.app.data.model

import com.google.gson.annotations.SerializedName

data class Question(
    @SerializedName("id")
    val id: String,

    @SerializedName("subject")
    val subject: String,

    @SerializedName("status")
    val status: QuestionStatus,

    @SerializedName("createdAt")
    val createdAt: String,

    @SerializedName("messages")
    val messages: List<QuestionMessage>? = null
)

enum class QuestionStatus {
    @SerializedName("OPEN")
    OPEN,

    @SerializedName("ANSWERED")
    ANSWERED,

    @SerializedName("CLOSED")
    CLOSED
}

data class QuestionMessage(
    @SerializedName("id")
    val id: String,

    @SerializedName("questionId")
    val questionId: String,

    @SerializedName("message")
    val message: String,

    @SerializedName("isAdmin")
    val isAdmin: Boolean,

    @SerializedName("createdAt")
    val createdAt: String
)

data class CreateQuestionRequest(
    @SerializedName("subject")
    val subject: String,

    @SerializedName("message")
    val message: String
)

data class SendMessageRequest(
    @SerializedName("questionId")
    val questionId: String,

    @SerializedName("message")
    val message: String
)

data class QuestionsResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("questions")
    val questions: List<Question>? = null,

    @SerializedName("error")
    val error: String? = null
)
