﻿$(() => {
    // ロードされた段階で認証情報を見に行く
    var accounts = null;
    var columns = null;
    // カラム初期表示(非同期)
    (async () => {
        // メインプロセスメソッドが非同期なのでawaitかけてアカウント情報を取得
        accounts = await window.accessApi.readPrefAccs();
        columns = await window.accessApi.readPrefCols();

        // データがなかったらDOM生成はしない
        if (!columns) {
            setColorPalette();
            return;
        }

        // カラム設定情報からDOMを生成
        columns.forEach((col) => {
            createColumn(col);
            createTimelineOptions(col, accounts);
        });
        // タイムラインカラーを初期設定
        $(".__cmb_tl_account").each((index, elm) => {
            const key_address = $(elm).find("option[selected]").val();
            $(elm).closest("li").find("h4").css("background-color", `#${accounts.get(key_address).acc_color}`);
        });
        // カラムをSortableにする
        $(".__ui_sortable").sortable({
            axis: "x",
            delay: 100,
            distance: 48,
            handle: ".col_head",
            revert: 50,
            tolerance: "pointer"
        });
        setButtonPermission();
        setColorPalette();
    })()

    // カラム追加ボタンイベント
    $("#on_add_column").on("click", (e) => {
        // カラム数を取得してカラムDOM生成と単体のタイムラインDOM生成を実行
        const column_uuid = createColumn(null);
        $(`#columns>table #${column_uuid}>ul`).append(createTimelineOptionLine({
            value: null,
            index: 1,
            accounts: accounts
        }));
        setButtonPermission();
        setColorPalette($(`#columns>table #${column_uuid}`));
    });

    // カラム削除ボタンイベント(動的バインド)
    $(document).on("click", ".__btn_del_col", (e) => {
        // ボタンを押したカラムのtdを取得してタイムラインDOM生成を実行
        $(e.target).closest("td").remove();
        setButtonPermission();
    });
    // タイムライン追加ボタンイベント(動的バインド)
    $(document).on("click", ".__btn_add_tl", (e) => {
        // ボタンを押したカラムのulリストを取得してタイムラインDOM生成を実行
        const ul = $(e.target).closest("td").find("ul");
        ul.append(createTimelineOptionLine({
            value: null,
            index: ul.children().length + 1,
            accounts: accounts
        }));
        setButtonPermission();
    });

    // タイムライン削除ボタンイベント(動的バインド)
    $(document).on("click", ".__btn_del_tl", (e) => {
        // 削除前に親のulのオブジェクトを保持
        const ul = $(e.target).closest("ul");
        // ボタンのあるタイムラインDOMを削除する
        $(e.target).closest("li").remove();
        // タイムラインの連番を再生成
        ul.children().each((index, elm) => $(elm).find(".tl_header_label").text(`Timeline ${index + 1}`));
        setButtonPermission();
    });

    // カラムカラー変更イベント(動的バインド)
    $(document).on("blur", ".__txt_col_color",
        (e) => $(e.target).closest("td").find(".col_head").css("background-color", `#${$(e.target).val()}`));

    // タイムラインカラー変更イベント(動的バインド)
    $(document).on("change", ".__cmb_tl_account", (e) => {
        // カラムカラーを選択したアカウントの色にする
        const target = $(e.target);
        const key_address = target.find("option:selected").val();
        target.closest("li").find("h4").css("background-color", `#${accounts.get(key_address).acc_color}`);
        setButtonPermission();
    });

    // カラム幅変更イベント(動的バインド)
    $(document).on("blur", ".__txt_col_width",
        (e) => $(e.target).closest("td").css("width", `${$(e.target).val()}px`));

    // 設定を保存ボタンイベント
    $("#on_save_pref").on("click", (e) => {
        // 現在のカラムを構成しているDOMのHTML構造から設定JSONを生成する
        const col_list = [];
        $("#columns>table td").each((col_index, col_elm) => {
            // タイムライン一覧を走査
            const tl_list = [];
            $(col_elm).find("ul>li").each((tl_index, tl_elm) => {
                // アカウントコンボボックスの値を取得
                const acc_address = $(tl_elm).find(".__cmb_tl_account").val();
                // 各フォームの情報をJSONでリストに追加
                tl_list.push({
                    'key_address': acc_address,
                    'timeline_type': $(tl_elm).find(".__cmb_tl_type").val(),
                    'account': accounts.get(acc_address),
                    'exclude_reblog': $(tl_elm).find(".__chk_exclude_reblog").prop("checked")
                });
            });
            // 各フォームの情報をJSONでリストに追加
            col_list.push({
                // デフォルトカラム名は「Column XX」
                'label_head': $(col_elm).find(".__txt_col_head").val() || `Column ${col_index + 1}`,
                'timelines': tl_list,
                // デフォルトカラムカラーは#808080(グレー)
                'col_color': $(col_elm).find(".__txt_col_color").val() || '808080',
                // デフォルトカラム長は330px
                'col_width': $(col_elm).find(".__txt_col_width").val() || '330',
                'd_hide': $(col_elm).find(".__chk_default_hide").prop("checked"),
                'd_flex': $(col_elm).find(".__chk_default_flex").prop("checked")
            });
        });
        // ファイルに追加する処理を書く(整形はメインプロセスで)
        window.accessApi.writePrefCols(col_list);

        alert("カラム設定を保存しました。");
    });

    // 戻るボタンイベント
    $("#on_close").on("click", (e) => {
        window.open("index.html", "_self");
    });

});
