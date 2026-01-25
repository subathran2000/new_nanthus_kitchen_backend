import { Entity, Column } from "typeorm";
import { BaseEntity } from "../../../common/entities/base.entity";

@Entity("measurement_types")
export class MeasurementType extends BaseEntity {
  @Column()
  name: string;

  @Column({ name: "short_name", nullable: true })
  shortName: string;
}
