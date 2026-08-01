import { DataTypes, Sequelize } from "sequelize";

export async function ensureEmployeeTokenNoColumn(
  sequelize: Sequelize,
): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();
  const employees = await queryInterface.describeTable("employees");

  if (!employees.token_no) {
    await queryInterface.addColumn("employees", "token_no", {
      type: DataTypes.STRING(5),
      allowNull: true,
    });
  }

  const indexes = (await queryInterface.showIndex("employees")) as Array<{
    fields?: Array<{ attribute?: string }>;
  }>;
  const hasTokenNoIndex = indexes.some((index) =>
    index.fields?.some((field) => field.attribute === "token_no"),
  );

  if (!hasTokenNoIndex) {
    await queryInterface.addIndex("employees", ["token_no"], {
      unique: true,
      name: "employees_token_no_unique",
    });
  }
}
