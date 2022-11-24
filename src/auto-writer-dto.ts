import fs from "fs";
import _ from "lodash";
import path from "path";
import util from "util";
import { TableData } from ".";
import { AutoOptions, CaseFileOption, CaseOption, LangOption, makeIndent, qNameSplit, recase } from "./types";
const mkdirp = require('mkdirp');

/** Writes text into dto files from TableData.text */
export class AutoWriterDto {
  tableText: { [name: string]: string };
  space: string[];
  options: {
    caseFile?: CaseFileOption;
    caseModel?: CaseOption;
    caseProp?: CaseOption;
    directory: string;
    lang?: LangOption;
    noAlias?: boolean;
    noInitModels?: boolean;
    noWrite?: boolean;
    singularize?: boolean;
    useDefine?: boolean;
    spaces?: boolean;
    indentation?: number;
  };
  constructor(tableData: TableData, options: AutoOptions) {
    this.tableText = tableData.text as { [name: string]: string };
    this.options = options;
    this.space = makeIndent(this.options.spaces, this.options.indentation);
  }

  write() {

    if (this.options.noWrite) {
      return Promise.resolve();
    }

    mkdirp.sync(path.resolve(this.options.directory || "./models", 'dto'));

    const tables = _.keys(this.tableText);

    // write the individual dto files
    const promises = tables.map(t => {
      return this.createFile(t);
    });

    return Promise.all(promises);
  }
  private createFile(table: string) {
    // FIXME: schema is not used to write the file name and there could be collisions. For now it
    // is up to the developer to pick the right schema, and potentially chose different output
    // folders for each different schema.
    const [schemaName, tableName] = qNameSplit(table);
    const fileName = recase(this.options.caseFile, tableName, this.options.singularize);
    const filePath = path.join(this.options.directory, 'dto' ,fileName + '.dto' + (this.options.lang === 'ts' ? '.ts' : '.js'));

    const writeFile = util.promisify(fs.writeFile);
    return writeFile(path.resolve(filePath), this.tableText[table]);
  }
}
