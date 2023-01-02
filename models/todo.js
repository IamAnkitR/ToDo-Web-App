/* eslint-disable require-jsdoc */
'use strict';
const {
  Model, Op
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
      Todo.belongsTo(Model.User,{
        foreignKey: 'userId'
      })
    }

    static addTodo({ title, dueDate, userId}) {
      return this.create({ title: title, dueDate: dueDate, completed: false, userId});
    }

    static getTodos() {
      return this.findAll();
    }

    static async overdue(userId) {
      return await Todo.findAll({
        where: {
          dueDate: { [Op.lt]: new Date().toLocaleDateString("en-CA") },
          userId,
          completed: false,
        },
      });
    }

    static async dueToday(userId) {
      // FILL IN HERE TO RETURN ITEMS DUE tODAY
      return await Todo.findAll({
        where: {
          dueDate: { [Op.eq]: new Date().toLocaleDateString("en-CA") },
          userId,
          completed: false,
        },
      });
    }

    static async dueLater(userId) {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      return await Todo.findAll({
        where: {
          dueDate: { [Op.gt]: new Date().toLocaleDateString("en-CA") },
          userId,
          completed: false,
        },
      });
    }

    static async remove(id, userId) {
      return this.destroy({
        where: {
          id,
          userId,
        }
      })
    }

    static async completedItems(userId) {
      return this.findAll({
        where: {
          completed: true,
          userId,
        }
      })
    }
    setCompletionStatus(receiver) {
      return this.update({ completed: receiver });
    }

  }
  Todo.init({
    title: DataTypes.STRING,
    dueDate: DataTypes.DATEONLY,
    completed: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'Todo',
  });
  return Todo;
};