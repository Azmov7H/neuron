import mongoose, { Schema, Document } from 'mongoose';

export interface IParamsList {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
}

export interface ISubSimulation {
  id: string;
  name: string;
  desc: string;
  equation: string;
  defaultParams: Record<string, number>;
  paramsList: IParamsList[];
}

export interface ISimulationConfig extends Document {
  domainKey: string;
  name: string;
  colorClass: string;
  glowClass: string;
  accentHex: string;
  simulations: ISubSimulation[];
}

const paramsListSchema = new Schema<IParamsList>({
  key: { type: String, required: true },
  label: { type: String, required: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  step: { type: Number, required: true }
}, { _id: false });

const subSimulationSchema = new Schema<ISubSimulation>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  desc: { type: String, required: true },
  equation: { type: String, required: true },
  defaultParams: { type: Schema.Types.Mixed, required: true },
  paramsList: [paramsListSchema]
}, { _id: false });

const simulationConfigSchema = new Schema<ISimulationConfig>({
  domainKey: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  colorClass: { type: String, required: true },
  glowClass: { type: String, required: true },
  accentHex: { type: String, required: true },
  simulations: [subSimulationSchema]
}, { timestamps: true });

export const SimulationConfig = mongoose.models.SimulationConfig as mongoose.Model<ISimulationConfig> || mongoose.model<ISimulationConfig>('SimulationConfig', simulationConfigSchema);
